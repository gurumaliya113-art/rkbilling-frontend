import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Edit, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useProducts, useCategories, useBrands } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { Card, Badge, Modal, TableSkeleton, EmptyState, Spinner } from '@/components/ui';
import { inr, dateOnly } from '@/lib/format';

const statusColor = { available: 'green', sold: 'slate', reserved: 'amber', returned: 'amber', damaged: 'rose', lost: 'rose' };

export default function Products() {
  const qc = useQueryClient();
  const { canManage, isAdmin } = useAuthStore();
  const [params, setParams] = useState({ page: 1, limit: 20, search: '', status: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useProducts(params);

  const rows = data?.data || [];
  const meta = data?.meta;

  const remove = async (p) => {
    if (!confirm(`Archive "${p.name}"? (soft delete)`)) return;
    try {
      await api.del(`/products/${p.id}`);
      toast.success('Product archived');
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-400">{meta?.total ?? 0} products</p>
        </div>
        {canManage() && (
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search code, name, barcode..."
              value={params.search}
              onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
            />
          </div>
          <select className="input w-40" value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All status</option>
            {['available', 'sold', 'reserved', 'returned', 'damaged', 'lost'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Package} title="No products found" message="Try adjusting filters or add a product" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Code</th>
                  <th className="table-th">Cost</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Added</th>
                  {canManage() && <th className="table-th text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {p.images?.[0]?.url
                            ? <img src={p.images[0].url} className="h-full w-full object-cover" alt="" />
                            : <div className="grid h-full w-full place-items-center text-slate-300"><Package size={16} /></div>}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-slate-400">{[p.brand?.name, p.color, p.size].filter(Boolean).join(' • ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-mono text-xs">{p.product_code}</td>
                    <td className="table-td">{inr(p.purchase_price)}</td>
                    <td className="table-td font-semibold">{inr(p.selling_price)}</td>
                    <td className="table-td">{p.stock}</td>
                    <td className="table-td"><Badge color={statusColor[p.status] || 'slate'}>{p.status}</Badge></td>
                    <td className="table-td text-xs text-slate-400">{dateOnly(p.created_at)}</td>
                    {canManage() && (
                      <td className="table-td">
                        <div className="flex justify-end gap-1">
                          <button className="btn-ghost p-1.5" onClick={() => { setEditing(p); setShowForm(true); }}><Edit size={15} /></button>
                          {isAdmin() && <button className="btn-ghost p-1.5 text-rose-500" onClick={() => remove(p)}><Trash2 size={15} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary" disabled={params.page <= 1} onClick={() => setParams({ ...params, page: params.page - 1 })}>Prev</button>
          <span className="text-sm">Page {meta.page} / {meta.totalPages}</span>
          <button className="btn-secondary" disabled={params.page >= meta.totalPages} onClick={() => setParams({ ...params, page: params.page + 1 })}>Next</button>
        </div>
      )}

      {showForm && <ProductForm product={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ProductForm({ product, onClose }) {
  const qc = useQueryClient();
  const { data: cats } = useCategories();
  const { data: brands } = useBrands();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pricePreview, setPricePreview] = useState(null);
  const [form, setForm] = useState(
    product || {
      product_code: '', name: '', barcode: '', category_id: '', brand_id: '',
      color: '', size: '', purchase_price: '', selling_price: '', stock: 0, rack_number: '', remarks: '', images: [],
    },
  );

  const previewPrice = async (code) => {
    setForm((f) => ({ ...f, product_code: code }));
    if (!code) { setPricePreview(null); return; }
    try {
      const res = await api.get('/products/price-preview', { code });
      setPricePreview(res.data);
      if (res.data.isHkTag) setForm((f) => ({ ...f, purchase_price: res.data.purchasePrice }));
    } catch { setPricePreview(null); }
  };

  const onUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      const res = await api.upload('/upload/images', fd);
      setForm((f) => ({ ...f, images: [...(f.images || []), ...res.data] }));
      toast.success('Images uploaded');
    } catch (err) { toast.error(err.message); } finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (Number(form.selling_price) < Number(form.purchase_price)) {
      toast.error('Selling price cannot be below purchase price');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      ['category_id', 'brand_id'].forEach((k) => { if (!payload[k]) payload[k] = null; });
      if (product) await api.put(`/products/${product.id}`, payload);
      else await api.post('/products', payload);
      toast.success(product ? 'Product updated' : 'Product created');
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Edit Product' : 'New Product'} size="lg">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Product Code / HK Tag *</label>
            <input className="input" required value={form.product_code} onChange={(e) => previewPrice(e.target.value)} placeholder="e.g. HK3929892" />
            {pricePreview && (
              <p className={`mt-1 text-xs ${pricePreview.isHkTag ? 'text-emerald-500' : 'text-amber-500'}`}>
                {pricePreview.isHkTag
                  ? `HK tag detected → auto purchase price ${inr(pricePreview.purchasePrice)}`
                  : 'Not an HK tag → enter purchase price manually'}
              </p>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">—</option>
              {(cats?.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <select className="input" value={form.brand_id || ''} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
              <option value="">—</option>
              {(brands?.data || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="label">Color</label><input className="input" value={form.color || ''} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
          <div><label className="label">Size</label><input className="input" value={form.size || ''} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
          <div>
            <label className="label">Purchase Price *</label>
            <input type="number" min="0" className="input" required value={form.purchase_price} disabled={pricePreview?.isHkTag}
              onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
          </div>
          <div><label className="label">Selling Price *</label><input type="number" min="0" className="input" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} /></div>
          <div><label className="label">Stock</label><input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><label className="label">Rack No.</label><input className="input" value={form.rack_number || ''} onChange={(e) => setForm({ ...form, rack_number: e.target.value })} /></div>
        </div>

        <div>
          <label className="label">Images</label>
          <div className="flex flex-wrap gap-2">
            {(form.images || []).map((img, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
            <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
              {uploading ? <Spinner /> : <Upload size={18} className="text-slate-400" />}
              <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
