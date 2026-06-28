import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, TableSkeleton, EmptyState, Badge } from '@/components/ui';
import { inr } from '@/lib/format';

/**
 * Product search / lookup — type code or name, results appear instantly with
 * price + stock. Read-only (no edit). Cost price is hidden for partners.
 */
export default function SearchProducts() {
  const navigate = useNavigate();
  const isPartner = useAuthStore((s) => s.user?.role) === 'partner';
  const [q, setQ] = useState('');
  const term = q.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['search-products', term],
    queryFn: () => api.get('/products', { search: term, limit: 30 }),
    enabled: term.length >= 1,
  });
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Search Products</h1>
        <p className="text-sm text-slate-400">Code ya naam type karo — niche price ke saath aa jayega</p>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            autoFocus
            className="input pl-10"
            placeholder="Code / naam / size type karo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      {term.length < 1 ? (
        <Card><EmptyState icon={Search} title="Search karo" message="Code ya naam likho, results yahan aa jaayenge" /></Card>
      ) : isFetching && rows.length === 0 ? (
        <Card><TableSkeleton cols={3} /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Package} title="Kuch nahi mila" message="Doosra naam ya code try karo" /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.id} className="flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} className="h-full w-full object-cover" alt="" />
                  : <div className="grid h-full w-full place-items-center text-slate-300"><Package size={20} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name || p.product_code}</p>
                <p className="truncate text-xs text-slate-400">
                  {p.product_code}{[p.size, p.color].filter(Boolean).length ? ' • ' + [p.size, p.color].filter(Boolean).join(' / ') : ''}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold">{inr(p.selling_price || p.purchase_price)}</span>
                  <Badge color={p.stock > 0 ? 'green' : 'rose'}>{p.stock > 0 ? `${p.stock} pcs` : 'Out'}</Badge>
                </div>
                {!isPartner && <p className="mt-0.5 text-[11px] text-slate-400">Cost: {inr(p.purchase_price)}</p>}
              </div>
              <button
                className="btn-ghost self-center p-2 text-brand-500"
                title="Billing me jao"
                onClick={() => navigate('/pos')}
              >
                <ShoppingCart size={18} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
