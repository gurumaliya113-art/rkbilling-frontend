import { useQuery } from '@tanstack/react-query';
import {
  IndianRupee, TrendingUp, ShoppingBag, Receipt, Package, Boxes, Wallet, Smartphone, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { useDashboard } from '@/hooks/useApi';
import { StatCard, Card, TableSkeleton } from '@/components/ui';
import { inr, num, dateOnly } from '@/lib/format';

const COLORS = ['#2457eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const { data: trend } = useQuery({
    queryKey: ['sales-trend', 'month'],
    queryFn: () => api.get('/analytics/sales-trend', { period: 'month' }),
  });

  const d = data?.data;
  const trendData = (trend?.data || []).map((t) => ({
    date: dateOnly(t.sale_date),
    revenue: Number(t.revenue),
    profit: Number(t.profit),
  }));

  const payData = d
    ? [
        { name: 'Cash', value: d.month.cash },
        { name: 'UPI', value: d.month.upi },
        { name: 'Card', value: d.month.card },
      ].filter((p) => p.value > 0)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-28 skeleton" />)}
        </div>
        <Card><TableSkeleton /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">Live overview of your shop performance</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={inr(d.today.revenue)} sub={`${d.today.bills} bills`} icon={IndianRupee} />
        <StatCard label="Today's Profit" value={inr(d.today.profit)} sub="recovered + margin" icon={TrendingUp} accent="green" />
        <StatCard label="Avg Bill (Today)" value={inr(d.today.avg_bill)} icon={Receipt} accent="violet" />
        <StatCard label="Yesterday" value={inr(d.yesterday.revenue)} sub={`${d.yesterday.bills} bills`} icon={ShoppingBag} accent="amber" />
      </div>

      {/* Period KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="This Week" value={inr(d.week.revenue)} sub={`Profit ${inr(d.week.profit)}`} icon={IndianRupee} />
        <StatCard label="This Month" value={inr(d.month.revenue)} sub={`Profit ${inr(d.month.profit)}`} icon={IndianRupee} accent="green" />
        <StatCard label="This Year" value={inr(d.year.revenue)} sub={`${num(d.year.bills)} bills`} icon={IndianRupee} accent="violet" />
        <StatCard label="Inventory Value" value={inr(d.inventory?.inventory_cost_value)} sub={`${num(d.inventory?.total_units)} units`} icon={Boxes} accent="amber" />
      </div>

      {/* Payment split */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cash (Month)" value={inr(d.month.cash)} icon={Wallet} accent="green" />
        <StatCard label="UPI (Month)" value={inr(d.month.upi)} icon={Smartphone} accent="brand" />
        <StatCard label="Card (Month)" value={inr(d.month.card)} icon={CreditCard} accent="violet" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Revenue &amp; Profit (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2457eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2457eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b820" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#2457eb" fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#prof)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Payment Mix (Month)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={payData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {payData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => inr(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Package size={16} /> Top Products</h3>
          <TopList rows={d.topProducts} nameKey="product_name" />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Top Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.topCategories}>
              <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => inr(v)} />
              <Bar dataKey="revenue" fill="#2457eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Staff Performance</h3>
          <TopList rows={d.staffPerformance} nameKey="staff_name" />
        </Card>
      </div>
    </div>
  );
}

function TopList({ rows = [], nameKey }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 6).map((r, i) => (
        <li key={i} className="flex items-center justify-between text-sm">
          <span className="truncate">{r[nameKey] || '—'}</span>
          <span className="font-semibold">{inr(r.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}
