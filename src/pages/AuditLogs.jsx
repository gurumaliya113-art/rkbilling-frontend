import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Monitor, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, TableSkeleton, EmptyState, Badge } from '@/components/ui';
import { dateTime } from '@/lib/format';

export default function AuditLogs() {
  const [params, setParams] = useState({ page: 1, limit: 30, search: '', action: '' });
  const { data, isLoading } = useQuery({ queryKey: ['audit', params], queryFn: () => api.get('/audit', params) });
  const rows = data?.data || [];
  const meta = data?.meta;

  const color = (a) => (a.includes('fail') ? 'rose' : a.includes('delete') || a.includes('cancel') ? 'amber' : 'slate');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-slate-400">Complete activity trail for fraud prevention</p>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input className="input pl-9" placeholder="Search action, invoice, user..." value={params.search}
              onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <TableSkeleton cols={6} /> : rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit entries" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50"><tr>
                <th className="table-th">Action</th><th className="table-th">User</th>
                <th className="table-th">Reference</th><th className="table-th">Device</th>
                <th className="table-th">IP</th><th className="table-th">When</th>
              </tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="table-td"><Badge color={color(l.action)}>{l.action}</Badge></td>
                    <td className="table-td">{l.user_name || '—'}</td>
                    <td className="table-td font-mono text-xs">{l.invoice_number || l.entity_type || '—'}</td>
                    <td className="table-td text-xs">
                      <span className="flex items-center gap-1 text-slate-400"><Monitor size={12} /> {l.os} • {l.browser}</span>
                    </td>
                    <td className="table-td text-xs"><span className="flex items-center gap-1 text-slate-400"><Globe size={12} /> {l.ip_address}</span></td>
                    <td className="table-td text-xs text-slate-400">{dateTime(l.created_at)}</td>
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
    </div>
  );
}
