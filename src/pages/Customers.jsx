import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Users, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useCustomers } from '@/hooks/useApi';
import { Card, Modal, TableSkeleton, EmptyState, Spinner, Badge } from '@/components/ui';
import { inr, dateTime } from '@/lib/format';

export default function Customers() {
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 20, search: '' });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState(null);
  const { data, isLoading } = useCustomers(params);
  const rows = data?.data || [];

  const openCustomer = async (id) => {
    const res = await api.get(`/customers/${id}`);
    setView(res.data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Customer</button>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, phone, email..." value={params.search}
            onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <TableSkeleton cols={5} /> : rows.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="table-th">Name</th><th className="table-th">Phone</th>
                  <th className="table-th">Lifetime</th><th className="table-th">Points</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="table-td font-medium">{c.name}</td>
                    <td className="table-td">{c.phone || '—'}</td>
                    <td className="table-td font-semibold">{inr(c.lifetime_purchase)}</td>
                    <td className="table-td"><Badge color="blue">{c.reward_points} pts</Badge></td>
                    <td className="table-td text-right">
                      <button className="btn-ghost p-1.5" onClick={() => openCustomer(c.id)}><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && <CustomerForm onClose={() => setShowForm(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['customers'] })} />}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name} size="md">
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Phone" value={view.phone} />
              <Info label="Email" value={view.email} />
              <Info label="Lifetime" value={inr(view.lifetime_purchase)} />
              <Info label="Reward Points" value={view.reward_points} />
            </div>
            <p className="text-xs font-semibold text-slate-400">Purchase History</p>
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {(view.purchase_history || []).map((h) => (
                <div key={h.id} className="flex justify-between py-2 text-sm">
                  <span className="font-mono text-xs">{h.invoice_number}</span>
                  <span className="text-xs text-slate-400">{dateTime(h.created_at)}</span>
                  <span className="font-semibold">{inr(h.total)}</span>
                </div>
              ))}
              {(!view.purchase_history || view.purchase_history.length === 0) && (
                <p className="py-4 text-center text-sm text-slate-400">No purchases yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="font-medium">{value || '—'}</p></div>;
}

function CustomerForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', form);
      toast.success('Customer created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title="New Customer" size="sm">
      <form onSubmit={save} className="space-y-3">
        <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Address</label><textarea className="input" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
