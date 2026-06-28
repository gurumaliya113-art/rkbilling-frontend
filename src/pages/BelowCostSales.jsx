import { useQuery } from '@tanstack/react-query';
import { TrendingDown, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard, TableSkeleton, EmptyState } from '@/components/ui';
import { inr, num, dateTime } from '@/lib/format';

/**
 * Admin view of below-cost (loss) sales. Revenue from these still counts in
 * sales, but profit is unaffected — the actual loss is tracked here.
 */
export default function BelowCostSales() {
  const { data, isLoading } = useQuery({
    queryKey: ['below-cost'],
    queryFn: () => api.get('/reports/below-cost'),
  });
  const rows = data?.data?.rows || [];
  const totals = data?.data?.totals || { revenue: 0, loss: 0, count: 0 };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Below Cost Sales</h1>
        <p className="text-sm text-slate-400">Cost se kam bika maal — revenue sales me jud gaya, loss yahan alag dikhta hai</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loss Sales" value={num(totals.count)} icon={TrendingDown} accent="amber" />
        <StatCard label="Revenue (in sales)" value={inr(totals.revenue)} icon={Package} accent="green" />
        <StatCard label="Total Loss" value={inr(totals.loss)} icon={TrendingDown} accent="rose" />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={TrendingDown} title="Koi loss sale nahi" message="Cost se kam koi maal nahi bika" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="table-th">Item</th>
                  <th className="table-th">Invoice</th>
                  <th className="table-th">Cost</th>
                  <th className="table-th">Becha (Sold)</th>
                  <th className="table-th">Loss</th>
                  <th className="table-th">By</th>
                  <th className="table-th">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                          {r.product_image
                            ? <img src={r.product_image} className="h-full w-full object-cover" alt="" />
                            : <div className="grid h-full w-full place-items-center text-slate-300"><Package size={14} /></div>}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.product_name}</p>
                          <p className="text-xs text-slate-400">{r.product_code} × {r.quantity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-mono text-xs">{r.invoice_number}</td>
                    <td className="table-td">{inr(r.cost_price)}</td>
                    <td className="table-td font-semibold">{inr(r.sold_price)}</td>
                    <td className="table-td font-semibold text-rose-500">- {inr(r.loss)}</td>
                    <td className="table-td text-xs">{r.staff || '—'}</td>
                    <td className="table-td text-xs text-slate-400">{dateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
