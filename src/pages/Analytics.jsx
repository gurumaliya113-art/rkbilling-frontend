import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, TableSkeleton } from '@/components/ui';
import { inr, dateOnly } from '@/lib/format';

export default function Analytics() {
  const [period, setPeriod] = useState('month');
  const [by, setBy] = useState('category');

  const { data: trend, isLoading: tl } = useQuery({
    queryKey: ['sales-trend', period],
    queryFn: () => api.get('/analytics/sales-trend', { period }),
  });
  const { data: breakdown, isLoading: bl } = useQuery({
    queryKey: ['breakdown', by],
    queryFn: () => api.get('/analytics/breakdown', { by }),
  });

  const trendData = (trend?.data || []).map((t) => ({
    date: dateOnly(t.sale_date), revenue: Number(t.revenue), profit: Number(t.profit), bills: t.bills,
  }));
  const bd = breakdown?.data || [];
  const nameKey = { category: 'category', brand: 'brand', staff: 'staff_name', product: 'product_name' }[by];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select className="input w-40" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {['week', 'month', 'quarter', 'year'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Revenue, Profit &amp; Bills Trend</h3>
        {tl ? <TableSkeleton /> : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b820" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v, n) => (n === 'bills' ? v : inr(v))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2457eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Performance Breakdown</h3>
          <select className="input w-40" value={by} onChange={(e) => setBy(e.target.value)}>
            {['category', 'brand', 'staff', 'product'].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {bl ? <TableSkeleton /> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={bd} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b820" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey={nameKey} width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => inr(v)} />
              <Bar dataKey="revenue" fill="#2457eb" radius={[0, 4, 4, 0]} />
              <Bar dataKey="profit" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
