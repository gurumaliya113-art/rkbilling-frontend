import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, StatCard, Spinner, EmptyState } from '@/components/ui';
import { inr, num } from '@/lib/format';

export default function Reports() {
  const { token } = useAuthStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/owner');
      setReport(res.data);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const download = (type, format) => {
    const url = `${api.baseUrl}/reports/export?type=${type}&format=${format}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}.${format}`;
        a.click();
      })
      .catch(() => toast.error('Export failed'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Owner Report</h1>
          <p className="text-sm text-slate-400">One-click business performance summary</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => download('invoices', 'xlsx')}><FileSpreadsheet size={16} /> Invoices XLSX</button>
          <button className="btn-secondary" onClick={() => download('products', 'csv')}><FileDown size={16} /> Products CSV</button>
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button className="btn-primary" onClick={generate} disabled={loading}>{loading ? <Spinner /> : 'Generate Report'}</button>
        </div>
      </div>

      {!report ? (
        <Card><EmptyState icon={FileDown} title="No report yet" message="Click Generate Report to build the latest summary" /></Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={inr(report.totals.revenue)} accent="brand" />
            <StatCard label="Profit" value={inr(report.totals.profit)} accent="green" />
            <StatCard label="Bills" value={num(report.totals.bills)} accent="violet" />
            <StatCard label="Inventory Value" value={inr(report.inventory?.inventory_cost_value)} accent="amber" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Cash" value={inr(report.totals.cash)} accent="green" />
            <StatCard label="UPI" value={inr(report.totals.upi)} accent="brand" />
            <StatCard label="Card" value={inr(report.totals.card)} accent="violet" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportTable title="Top Products" rows={report.topProducts} nameKey="product_name" />
            <ReportTable title="Worst Products" rows={report.worstProducts} nameKey="product_name" />
            <ReportTable title="Category Performance" rows={report.categoryPerformance} nameKey="category" />
            <ReportTable title="Brand Performance" rows={report.brandPerformance} nameKey="brand" />
            <ReportTable title="Staff Performance" rows={report.staffPerformance} nameKey="staff_name" />
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Dead / Unsold Stock</h3>
              <div className="grid grid-cols-3 gap-2">
                {(report.deadStock || []).slice(0, 9).map((p) => (
                  <div key={p.id} className="rounded-lg border border-slate-200 p-2 text-center dark:border-slate-800">
                    <div className="mb-1 h-16 w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                      {p.images?.[0]?.url && <img src={p.images[0].url} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <p className="truncate text-xs font-medium">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{inr(p.selling_price)}</p>
                  </div>
                ))}
              </div>
              {(!report.deadStock || report.deadStock.length === 0) && <p className="text-sm text-slate-400">None 🎉</p>}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportTable({ title, rows = [], nameKey }) {
  return (
    <Card className="overflow-hidden">
      <h3 className="border-b border-slate-200 px-5 py-3 font-semibold dark:border-slate-800">{title}</h3>
      <table className="w-full">
        <tbody>
          {rows.slice(0, 8).map((r, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-5 py-2 text-sm">{r[nameKey] || '—'}</td>
              <td className="px-5 py-2 text-right text-sm text-slate-400">{num(r.units_sold)} units</td>
              <td className="px-5 py-2 text-right text-sm font-semibold">{inr(r.revenue)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="px-5 py-4 text-sm text-slate-400">No data</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}
