import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Store, Users as UsersIcon, Printer, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, Modal, Spinner, Badge } from '@/components/ui';

export default function Settings() {
  const [tab, setTab] = useState('shop');
  const tabs = [['shop', 'Shop', Store], ['printer', 'Invoice & Printer', Printer], ['users', 'Users & Roles', UsersIcon]];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {tab === 'shop' && <ShopSettings />}
      {tab === 'printer' && <PrinterSettings />}
      {tab === 'users' && <UserSettings />}
    </div>
  );
}

function ShopSettings() {
  const { isAdmin } = useAuthStore();
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data?.data?.shop) setForm(data.data.shop); }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/shop', {
        name: form.name, phone: form.phone, address: form.address, city: form.city, state: form.state,
        pincode: form.pincode, gstin: form.gstin, is_gst_enabled: form.is_gst_enabled, default_tax_pct: form.default_tax_pct, currency: form.currency,
      });
      toast.success('Shop updated');
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Shop Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} />
        <Field label="GSTIN" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} />
        <Field label="Default Tax %" type="number" value={form.default_tax_pct} onChange={(v) => setForm({ ...form, default_tax_pct: v })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.is_gst_enabled} onChange={(e) => setForm({ ...form, is_gst_enabled: e.target.checked })} />
        Enable GST on invoices
      </label>
      {isAdmin() && <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : 'Save Changes'}</button>}
    </Card>
  );
}

function PrinterSettings() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });
  const [printer, setPrinter] = useState({ width: '80mm', auto_print: true });
  const [invoice, setInvoice] = useState({ prefix: 'RK', footer: '' });
  useEffect(() => {
    if (data?.data?.settings) {
      setPrinter(data.data.settings.printer || { width: '80mm', auto_print: true });
      setInvoice(data.data.settings.invoice || { prefix: 'RK', footer: '' });
    }
  }, [data]);

  const save = async () => {
    try {
      await api.put('/settings', { key: 'printer', value: printer });
      await api.put('/settings', { key: 'invoice', value: { ...invoice } });
      toast.success('Saved');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <label className="label">Thermal Printer Width</label>
        <select className="input w-40" value={printer.width} onChange={(e) => setPrinter({ ...printer, width: e.target.value })}>
          <option value="58mm">58mm</option>
          <option value="80mm">80mm</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!printer.auto_print} onChange={(e) => setPrinter({ ...printer, auto_print: e.target.checked })} />
        Auto-print after invoice creation
      </label>
      <Field label="Invoice Prefix" value={invoice.prefix} onChange={(v) => setInvoice({ ...invoice, prefix: v })} />
      <Field label="Invoice Footer" value={invoice.footer} onChange={(v) => setInvoice({ ...invoice, footer: v })} />
      <button className="btn-primary" onClick={save}>Save</button>
    </Card>
  );
}

function UserSettings() {
  const qc = useQueryClient();
  const { isAdmin } = useAuthStore();
  const { data } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users') });
  const [showForm, setShowForm] = useState(false);
  const users = data?.data || [];

  const toggle = async (u) => {
    try {
      await api.patch(`/users/${u.id}/active`, { is_active: !u.is_active });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <h3 className="font-semibold">Team Members</h3>
        {isAdmin() && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add User</button>}
      </div>
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800/50"><tr>
          <th className="table-th">Name</th><th className="table-th">Email</th>
          <th className="table-th">Role</th><th className="table-th">Status</th>
          {isAdmin() && <th className="table-th text-right">Action</th>}
        </tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="table-td font-medium">{u.full_name}</td>
              <td className="table-td text-sm">{u.email}</td>
              <td className="table-td capitalize"><Badge color="blue">{u.role}</Badge></td>
              <td className="table-td"><Badge color={u.is_active ? 'green' : 'rose'}>{u.is_active ? 'active' : 'disabled'}</Badge></td>
              {isAdmin() && (
                <td className="table-td text-right">
                  <button className="btn-ghost text-xs" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <UserForm onClose={() => setShowForm(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })} />}
    </Card>
  );
}

function UserForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'staff', phone: '' });
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      toast.success('User created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title="Add User" size="sm">
      <form onSubmit={save} className="space-y-3">
        <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {['staff', 'manager', 'admin', 'partner'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" required={required} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
