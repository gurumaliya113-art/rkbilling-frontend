import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Printer, Eye, Ban, ReceiptText } from 'lucide-react';
import { api } from '@/lib/api';
import { useInvoices } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { Card, Badge, Modal, TableSkeleton, EmptyState } from '@/components/ui';
import { inr, dateTime } from '@/lib/format';
import { printInvoice } from '@/lib/print';

const statusColor = { completed: 'green', pending_print: 'amber', cancelled: 'rose', returned: 'rose', partially_returned: 'amber' };

export default function Invoices() {
  const qc = useQueryClient();
  const { canManage } = useAuthStore();
  const [params, setParams] = useState({ page: 1, limit: 20, search: '', status: '', payment_mode: '' });
  const [view, setView] = useState(null);
  const { data, isLoading } = useInvoices(params);
  const rows = data?.data || [];
  const meta = data?.meta;

  const open = async (id) => {
    const res = await api.get(`/invoices/${id}`);
    setView(res.data);
  };

  const reprint = async (inv) => {
    try {
      const res = await api.post(`/invoices/${inv.id}/reprint`);
      const full = await api.get(`/invoices/${inv.id}`);
      printInvoice(full.data);
      if (res.data.pdf_url) window.open(res.data.pdf_url, '_blank');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    } catch (e) { toast.error(e.message); }
  };

  const cancel = async (inv) => {
    if (!confirm(`Cancel ${inv.invoice_number}? Stock will be restored.`)) return;
    try {
      await api.post(`/invoices/${inv.id}/cancel`);
      toast.success('Invoice cancelled');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Invoices</h1>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input className="input pl-9" placeholder="Search invoice number..." value={params.search}
              onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })} />
          </div>
          <select className="input w-40" value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All status</option>
            {Object.keys(statusColor).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input w-36" value={params.payment_mode} onChange={(e) => setParams({ ...params, payment_mode: e.target.value, page: 1 })}>
            <option value="">All payments</option>
            {['cash', 'upi', 'card', 'mixed'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <TableSkeleton cols={6} /> : rows.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No invoices yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="table-th">Invoice</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Payment</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Date</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="table-td font-mono text-xs font-semibold">{inv.invoice_number}</td>
                    <td className="table-td">{inv.customer?.name || 'Walk-in'}</td>
                    <td className="table-td font-semibold">{inr(inv.total)}</td>
                    <td className="table-td capitalize">{inv.payment_mode}</td>
                    <td className="table-td"><Badge color={statusColor[inv.status]}>{inv.status}</Badge></td>
                    <td className="table-td text-xs text-slate-400">{dateTime(inv.created_at)}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => open(inv.id)}><Eye size={15} /></button>
                        <button className="btn-ghost p-1.5" onClick={() => reprint(inv)}><Printer size={15} /></button>
                        {canManage() && inv.status !== 'cancelled' && (
                          <button className="btn-ghost p-1.5 text-rose-500" onClick={() => cancel(inv)}><Ban size={15} /></button>
                        )}
                      </div>
                    </td>
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

      <Modal open={!!view} onClose={() => setView(null)} title={view?.invoice_number} size="md">
        {view && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>{dateTime(view.created_at)}</span>
              <Badge color={statusColor[view.status]}>{view.status}</Badge>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(view.items || []).map((it) => (
                <div key={it.id} className="flex items-center gap-3 py-2">
                  {it.product_image && <img src={it.product_image} className="h-10 w-10 rounded object-cover" alt="" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{it.product_name}</p>
                    <p className="text-xs text-slate-400">{it.quantity} × {inr(it.selling_price)}</p>
                  </div>
                  <span className="text-sm font-semibold">{inr(it.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-3 text-right dark:border-slate-800">
              <p className="text-lg font-bold">{inr(view.total)}</p>
              <p className="text-xs capitalize text-slate-400">{view.payment_mode} • {view.staffName}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => printInvoice(view)}><Printer size={16} /> Print</button>
              {view.pdf_url && <a className="btn-primary flex-1" href={view.pdf_url} target="_blank" rel="noreferrer">View PDF</a>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
