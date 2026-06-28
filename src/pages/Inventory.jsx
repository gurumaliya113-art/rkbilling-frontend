import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Boxes, Plus, Upload, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard, Modal, TableSkeleton, EmptyState, Spinner, Badge } from '@/components/ui';
import { inr, num, dateTime } from '@/lib/format';

export default function Inventory() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: overview } = useQuery({ queryKey: ['inv-overview'], queryFn: () => api.get('/inventory/overview') });
  const { data: movements, isLoading: ml } = useQuery({ queryKey: ['inv-movements'], queryFn: () => api.get('/inventory/movements', { limit: 50 }), enabled: tab === 'movements' });
  const { data: dead, isLoading: dl } = useQuery({ queryKey: ['inv-dead'], queryFn: () => api.get('/inventory/dead-stock'), enabled: tab === 'dead' });

  const ov = overview?.data;
  const val = ov?.valuation || {};
  const byStatus = ov?.byStatus || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowImport(true)}><Upload size={16} /> Bulk Import</button>
          <button className="btn-primary" onClick={() => setShowAdjust(true)}><Plus size={16} /> Adjust Stock</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={num(val.total_products)} icon={Boxes} />
        <StatCard label="Total Units" value={num(val.total_units)} icon={Boxes} accent="violet" />
        <StatCard label="Cost Value" value={inr(val.inventory_cost_value)} icon={Boxes} accent="amber" />
        <StatCard label="Retail Value" value={inr(val.inventory_retail_value)} icon={Boxes} accent="green" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus).map(([k, v]) => (
            <Badge key={k} color="slate">{k}: {v}</Badge>
          ))}
        </div>
      </Card>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {[['overview', 'Overview'], ['movements', 'Stock History'], ['dead', 'Dead Stock']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium ${tab === k ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'movements' && (
        <Card className="overflow-hidden">
          {ml ? <TableSkeleton /> : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50"><tr>
                <th className="table-th">Product</th><th className="table-th">Type</th>
                <th className="table-th">Qty</th><th className="table-th">After</th>
                <th className="table-th">By</th><th className="table-th">When</th>
              </tr></thead>
              <tbody>
                {(movements?.data || []).map((m) => (
                  <tr key={m.id}>
                    <td className="table-td">{m.product?.name || '—'}</td>
                    <td className="table-td"><Badge color={m.quantity > 0 ? 'green' : 'rose'}>{m.type}</Badge></td>
                    <td className="table-td">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                    <td className="table-td">{m.stock_after}</td>
                    <td className="table-td text-xs">{m.user?.full_name || '—'}</td>
                    <td className="table-td text-xs text-slate-400">{dateTime(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'dead' && (
        <Card className="overflow-hidden">
          {dl ? <TableSkeleton /> : (dead?.data || []).length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No dead stock" message="All products are moving well" />
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50"><tr>
                <th className="table-th">Product</th><th className="table-th">Code</th>
                <th className="table-th">Stock</th><th className="table-th">Price</th>
              </tr></thead>
              <tbody>
                {(dead?.data || []).map((p) => (
                  <tr key={p.id}>
                    <td className="table-td">{p.name}</td>
                    <td className="table-td font-mono text-xs">{p.product_code}</td>
                    <td className="table-td">{p.stock}</td>
                    <td className="table-td">{inr(p.selling_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'overview' && (
        <Card className="p-6 text-sm text-slate-400">
          Use the tabs above to review stock movement history and identify dead stock. Adjust stock or run a bulk import using the buttons.
        </Card>
      )}

      {showAdjust && <AdjustModal onClose={() => setShowAdjust(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['inv-overview'] })} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['inv-overview'] })} />}
    </div>
  );
}

function AdjustModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ code: '', product_id: '', type: 'stock_in', quantity: 1, reason: '' });
  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const find = async () => {
    try {
      const res = await api.get(`/products/find/${encodeURIComponent(form.code)}`);
      setProduct(res.data);
      setForm((f) => ({ ...f, product_id: res.data.id }));
    } catch (e) { toast.error(e.message); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.product_id) { toast.error('Find a product first'); return; }
    setSaving(true);
    try {
      await api.post('/inventory/adjust', { product_id: form.product_id, type: form.type, quantity: Number(form.quantity), reason: form.reason });
      toast.success('Stock adjusted');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Adjust Stock" size="sm">
      <div className="flex gap-2">
        <input className="input" placeholder="Product code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <button className="btn-secondary" onClick={find}>Find</button>
      </div>
      {product && <p className="mt-2 text-sm text-emerald-500">{product.name} — current stock {product.stock}</p>}
      <form onSubmit={save} className="mt-3 space-y-3">
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {['stock_in', 'stock_out', 'adjustment', 'transfer', 'damage', 'loss', 'return'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="number" className="input" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <input className="input" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Apply'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ onClose, onSaved }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const parse = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload('/upload/parse', fd);
      setRows(res.data.rows);
      toast.success(`${res.data.count} rows parsed`);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const importRows = async () => {
    setBusy(true);
    try {
      const res = await api.post('/products/bulk-import', { rows });
      toast.success(`${res.data.imported} products imported`);
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Bulk Import (CSV / Excel)" size="md">
      <p className="mb-2 text-xs text-slate-400">
        Columns: product_code, name, color, size, stock, selling_price, purchase_price (optional for HK tags), mrp, barcode, rack_number
      </p>
      <input type="file" accept=".csv,.xlsx,.xls" className="input" onChange={parse} />
      {rows.length > 0 && (
        <>
          <p className="mt-3 text-sm">{rows.length} rows ready to import.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={importRows} disabled={busy}>{busy ? <Spinner /> : 'Import'}</button>
          </div>
        </>
      )}
    </Modal>
  );
}
