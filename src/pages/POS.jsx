import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2, Plus, Minus, Printer, X, Package, Camera } from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { Card, Spinner, EmptyState, Modal } from '@/components/ui';
import { inr, inr2 } from '@/lib/format';
import { printInvoice } from '@/lib/print';
import CodeScanner from '@/components/CodeScanner';
import QuickPhotoBill from '@/components/QuickPhotoBill';

export default function POS() {
  const cart = useCartStore();
  const inputRef = useRef(null);
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [mode, setMode] = useState('scan'); // 'scan' | 'photo'

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Keyboard shortcut: F2 focuses search, F4 opens scanner, F9 checkout
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); setScanOpen(true); }
      if (e.key === 'F9') { e.preventDefault(); checkout(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Look up a product by code and add it to the cart.
  const addByCode = async (value) => {
    const c = (value || '').trim();
    if (!c) return;
    setSearching(true);
    try {
      const res = await api.get(`/products/find/${encodeURIComponent(c)}`);
      const p = res.data;
      if (p.stock <= 0) { toast.error(`${p.name} out of stock hai`); return; }
      cart.addItem(p);
      setCode('');
      const dup = p.matches > 1 ? ` (${p.matches} same codes — sabse zyada stock wala liya)` : '';
      toast.success(`Added ${p.name}${dup}`);
    } catch (err) {
      toast.error(err.message || 'Product nahi mila');
    } finally {
      setSearching(false);
      inputRef.current?.focus();
    }
  };

  const search = (e) => {
    e?.preventDefault();
    addByCode(code);
  };

  const onScanned = (detectedCode) => {
    setScanOpen(false);
    addByCode(detectedCode);
  };

  // Live type-ahead suggestions (debounced) — no need to type the full code
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

  useEffect(() => {
    const q = code.trim();
    if (q.length < 1) { setSuggestions([]); setShowSug(false); return undefined; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/products', { search: q, limit: 8 });
        setSuggestions(res.data || []);
        setShowSug(true);
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [code]);

  // Add a product object straight to the cart (used by dropdown clicks)
  const addProductDirect = (p) => {
    if (p.stock <= 0) { toast.error(`${p.name} out of stock hai`); return; }
    cart.addItem(p);
    setCode('');
    setSuggestions([]);
    setShowSug(false);
    toast.success(`Added ${p.name}`);
    inputRef.current?.focus();
  };

  const checkout = async () => {
    if (cart.items.length === 0) { toast.error('Cart is empty'); return; }
    for (const it of cart.items) {
      if (it.selling_price < it.purchase_price) {
        toast.error(`${it.product_name}: selling price below purchase price`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          product_code: i.product_code,
          product_name: i.product_name,
          product_image: i.product_image,
          category: i.category,
          brand: i.brand,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
          selling_price: i.selling_price,
        })),
        customer_id: cart.customer?.id || null,
        payment_mode: cart.paymentMode,
        payment_split: cart.paymentMode === 'mixed' ? cart.paymentSplit : {},
        discount: cart.discount,
        tax_pct: cart.taxPct,
      };
      const res = await api.post('/invoices', payload);
      setLastInvoice(res.data);
      cart.clear();
      toast.success(`Invoice ${res.data.invoice_number} created`);
      printInvoice(res.data); // auto-print
    } catch (err) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Billing mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('scan')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === 'scan' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Code / Scan
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === 'photo' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Photo Bill
        </button>
      </div>

      {mode === 'photo' && <QuickPhotoBill />}

      {mode === 'scan' && (
      <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: search + items */}
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-4">
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                ref={inputRef}
                className="input pl-10"
                placeholder="Code / naam type karo ya scan karo  (F2 search · F4 camera)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onFocus={() => suggestions.length && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 200)}
                autoComplete="off"
              />

              {/* Type-ahead dropdown */}
              {showSug && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {suggestions.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addProductDirect(p)}
                      className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-brand-500/5 dark:border-slate-800"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} className="h-full w-full object-cover" alt="" />
                          : <div className="grid h-full w-full place-items-center text-slate-300"><Package size={16} /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {p.product_code}{[p.size, p.color].filter(Boolean).length ? ' • ' + [p.size, p.color].filter(Boolean).join(' / ') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{inr(p.selling_price || p.purchase_price)}</p>
                        <p className={`text-xs ${p.stock <= 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {p.stock <= 0 ? 'Out' : `${p.stock} pcs`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="btn-secondary" onClick={() => setScanOpen(true)} title="Camera scan (F4)">
              <Camera size={18} />
            </button>
            <button type="submit" className="btn-primary" disabled={searching}>
              {searching ? <Spinner /> : 'Add'}
            </button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          {cart.items.length === 0 ? (
            <EmptyState icon={Package} title="No items yet" message="Scan a product code to begin billing" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cart.items.map((it) => (
                <CartRow key={it.product_id} item={it} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right: checkout */}
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Bill Summary</h3>

          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={inr2(cart.subtotal())} />
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Discount</span>
              <input
                type="number" min="0"
                className="input w-28 py-1 text-right"
                value={cart.discount}
                onChange={(e) => cart.setDiscount(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tax %</span>
              <input
                type="number" min="0"
                className="input w-28 py-1 text-right"
                value={cart.taxPct}
                onChange={(e) => cart.setTaxPct(e.target.value)}
              />
            </div>
            <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{inr2(cart.total())}</span>
            </div>
            <p className="text-right text-xs text-emerald-500">Profit: {inr2(cart.totalProfit())}</p>
          </div>

          {/* Payment mode */}
          <div className="mt-4">
            <label className="label">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['cash', 'upi', 'card', 'mixed'].map((m) => (
                <button
                  key={m}
                  onClick={() => cart.setPaymentMode(m)}
                  className={`rounded-lg border py-2 text-xs font-semibold capitalize transition ${
                    cart.paymentMode === m
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {cart.paymentMode === 'mixed' && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map((k) => (
                  <div key={k}>
                    <label className="label capitalize">{k}</label>
                    <input
                      type="number" min="0"
                      className="input py-1"
                      value={cart.paymentSplit[k]}
                      onChange={(e) => cart.setPaymentSplit({ ...cart.paymentSplit, [k]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <CustomerPicker />

          <button className="btn-primary mt-4 w-full py-3 text-base" onClick={checkout} disabled={submitting}>
            {submitting ? <Spinner /> : `Checkout • ${inr(cart.total())}  (F9)`}
          </button>
          {cart.items.length > 0 && (
            <button className="btn-ghost mt-2 w-full text-rose-500" onClick={() => cart.clear()}>
              Clear cart
            </button>
          )}
        </Card>
      </div>

      {/* Invoice success modal */}
      <Modal open={!!lastInvoice} onClose={() => setLastInvoice(null)} title="Invoice Created" size="sm">
        {lastInvoice && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
              ✓
            </div>
            <p className="text-lg font-bold">{lastInvoice.invoice_number}</p>
            <p className="text-2xl font-extrabold">{inr2(lastInvoice.total)}</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => printInvoice(lastInvoice)}>
                <Printer size={16} /> Print
              </button>
              {lastInvoice.pdf_url && (
                <a className="btn-primary flex-1" href={lastInvoice.pdf_url} target="_blank" rel="noreferrer">
                  View PDF
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Camera OCR scanner */}
      <CodeScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onScanned} />
    </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CartRow({ item }) {
  const cart = useCartStore();
  const belowCost = item.selling_price < item.purchase_price;
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {item.product_image ? (
          <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-300"><Package size={20} /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.product_name}</p>
        <p className="text-xs text-slate-400">
          {item.product_code} • {[item.size, item.color].filter(Boolean).join(' / ')}
        </p>
        <p className="text-xs text-slate-400">Cost: {inr(item.purchase_price)}</p>
      </div>

      {/* Selling price */}
      <div className="w-24">
        <input
          type="number" min={item.purchase_price}
          className={`input py-1 text-right text-sm ${belowCost ? 'border-rose-500' : ''}`}
          value={item.selling_price}
          onChange={(e) => cart.updateItem(item.product_id, { selling_price: Number(e.target.value) })}
        />
        {belowCost && <p className="text-[10px] text-rose-500">Below cost!</p>}
      </div>

      {/* Qty */}
      <div className="flex items-center gap-1">
        <button className="btn-ghost p-1" onClick={() => cart.updateItem(item.product_id, { quantity: Math.max(1, item.quantity - 1) })}>
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          className="btn-ghost p-1"
          onClick={() => {
            if (item.quantity >= item.max_stock) { toast.error('Reached available stock'); return; }
            cart.updateItem(item.product_id, { quantity: item.quantity + 1 });
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="w-20 text-right text-sm font-bold">{inr(item.selling_price * item.quantity)}</div>
      <button className="text-rose-500" onClick={() => cart.removeItem(item.product_id)}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function CustomerPicker() {
  const cart = useCartStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '' });

  const doSearch = async (val) => {
    setQ(val);
    if (val.length < 2) { setResults([]); return; }
    const res = await api.get('/customers', { search: val, limit: 5 });
    setResults(res.data);
  };

  const createNew = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    const res = await api.post('/customers', form);
    cart.setCustomer(res.data);
    setOpen(false);
    toast.success('Customer added');
  };

  return (
    <div className="mt-4">
      <label className="label">Customer (optional)</label>
      {cart.customer ? (
        <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
          <span>{cart.customer.name} {cart.customer.phone && `• ${cart.customer.phone}`}</span>
          <button onClick={() => cart.setCustomer(null)}><X size={14} /></button>
        </div>
      ) : (
        <button className="btn-secondary w-full" onClick={() => setOpen(true)}>+ Add Customer</button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Select Customer" size="sm">
        <input className="input" placeholder="Search by name or phone" value={q} onChange={(e) => doSearch(e.target.value)} />
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => { cart.setCustomer(c); setOpen(false); }}
            >
              {c.name} • {c.phone}
            </button>
          ))}
        </div>
        <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
        <p className="mb-2 text-xs font-semibold text-slate-400">New customer</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button className="btn-primary mt-3 w-full" onClick={createNew}>Save &amp; Select</button>
      </Modal>
    </div>
  );
}
