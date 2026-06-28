import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, Upload, Printer, X, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useCategories } from '@/hooks/useApi';
import { Card, Spinner, Modal } from '@/components/ui';
import { inr, inr2 } from '@/lib/format';
import { printInvoice } from '@/lib/print';

/**
 * Quick Photo Bill — no product master needed.
 * Take/upload a photo, pick a category, enter a rate + quantity, choose payment,
 * and Save. The photo is stored in Supabase Storage and the sale is recorded as
 * an invoice (with the photo) so it shows up in history like any other bill.
 */
export default function QuickPhotoBill() {
  const { data: cats } = useCategories();
  const fileRef = useRef(null);
  const [image, setImage] = useState(null); // { url, path }
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [cost, setCost] = useState('');
  const [lossOk, setLossOk] = useState(false);
  const [qty, setQty] = useState(1);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await api.upload('/upload/images', fd);
      setImage(res.data?.[0] || null);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setImage(null); setCategory(''); setName(''); setRate(''); setCost(''); setLossOk(false); setQty(1); setPaymentMode('cash');
    setCustName(''); setCustPhone('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    if (!rate || Number(rate) <= 0) { toast.error('Rate daalo'); return; }
    if (!custName.trim() && !custPhone.trim()) { toast.error('Customer ka naam ya phone daalo'); return; }
    const costNum = Number(cost) || 0;
    const below = costNum > 0 && Number(rate) < costNum;
    if (below && !lossOk) { toast.error('Rate cost se kam hai — "Loss sale" tick karo'); return; }
    setSaving(true);
    try {
      const label = name.trim() || category || 'Quick Item';
      const payload = {
        items: [{
          product_id: null,
          product_code: 'QB-' + Date.now(),
          product_name: label,
          product_image: image?.url || null,
          category: category || null,
          purchase_price: costNum,
          selling_price: Number(rate),
          quantity: Number(qty) || 1,
          is_below_cost: below && lossOk,
        }],
        customer: { name: custName.trim() || null, phone: custPhone.trim() || null },
        payment_mode: paymentMode,
        discount: 0,
        tax_pct: 0,
        notes: 'Quick photo bill',
      };
      const res = await api.post('/invoices', payload);
      setLastInvoice(res.data);
      printInvoice(res.data);
      reset();
      toast.success(`Bill ${res.data.invoice_number} ban gaya`);
    } catch (err) {
      toast.error(err.message || 'Bill nahi bana');
    } finally {
      setSaving(false);
    }
  };

  const total = (Number(rate) || 0) * (Number(qty) || 1);
  const costNum = Number(cost) || 0;
  const below = costNum > 0 && Number(rate) > 0 && Number(rate) < costNum;

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-5">
        <h3 className="mb-1 text-lg font-bold">Photo Bill</h3>
        <p className="mb-4 text-sm text-slate-400">Photo lo, category chuno, rate daalo, save karo.</p>

        {/* Photo */}
        <div className="mb-4">
          <label className="label">Product Photo</label>
          {image ? (
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              <img src={image.url} alt="" className="h-full w-full object-contain" />
              <button
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                onClick={() => setImage(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 dark:border-slate-700">
              {uploading ? <Spinner /> : (
                <>
                  <Camera size={32} />
                  <span className="text-sm">Photo kheecho ya upload karo</span>
                  <span className="text-xs">(camera / gallery)</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPick}
              />
            </label>
          )}
        </div>

        {/* Category + name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— choose —</option>
              {(cats?.data || []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Item Name (optional)</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blue Shirt" />
          </div>
        </div>

        {/* Rate + cost + qty */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Rate / Selling (₹) *</label>
            <input type="number" min="1" inputMode="decimal" className="input" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">Cost Price (optional)</label>
            <input type="number" min="0" inputMode="decimal" className="input" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="1" className="input" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>

        {/* Loss sale toggle — appears when rate is below the cost price */}
        {below && (
          <label className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-sm text-amber-600 dark:text-amber-400">
            <input type="checkbox" checked={lossOk} onChange={(e) => setLossOk(e.target.checked)} />
            Cost se kam bech raha hu — <b>Loss sale</b> (₹{(costNum - Number(rate)).toFixed(0)} loss)
          </label>
        )}

        {/* Customer */}
        <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <label className="label">Customer (bill inke naam pe banega)</label>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Naam" value={custName} onChange={(e) => setCustName(e.target.value)} />
            <input className="input" placeholder="Phone" inputMode="tel" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
          </div>
        </div>

        {/* Payment */}
        <div className="mt-3">
          <label className="label">Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {['cash', 'upi', 'card'].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`rounded-lg border py-2 text-xs font-semibold capitalize transition ${
                  paymentMode === m ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-lg font-bold">Total: {inr(total)}</span>
          <button className="btn-primary px-6 py-3" onClick={save} disabled={saving || uploading}>
            {saving ? <Spinner /> : 'Save & Bill'}
          </button>
        </div>
      </Card>

      <Modal open={!!lastInvoice} onClose={() => setLastInvoice(null)} title="Bill Created" size="sm">
        {lastInvoice && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">✓</div>
            <p className="text-lg font-bold">{lastInvoice.invoice_number}</p>
            <p className="text-2xl font-extrabold">{inr2(lastInvoice.total)}</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => printInvoice(lastInvoice)}>
                <Printer size={16} /> Print
              </button>
              {lastInvoice.pdf_url && (
                <a className="btn-primary flex-1" href={lastInvoice.pdf_url} target="_blank" rel="noreferrer">View PDF</a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
