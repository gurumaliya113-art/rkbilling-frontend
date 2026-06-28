import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Package, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, EmptyState } from '@/components/ui';
import { inr, timeOnly } from '@/lib/format';

/**
 * Live Owner Panel — every sale appears instantly (realtime invalidation in
 * useRealtime triggers refetch). Shows product image, prices, profit, staff.
 */
export default function LiveOwnerPanel() {
  const { data } = useQuery({
    queryKey: ['live-sales'],
    queryFn: () => api.get('/invoices', { limit: 30, status: 'completed' }),
    refetchInterval: 20_000,
  });
  const sales = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <h1 className="text-2xl font-bold">Live Owner Panel</h1>
        <Radio size={18} className="text-emerald-500" />
      </div>
      <p className="text-sm text-slate-400">Every sale appears here instantly — monitor your shop from anywhere.</p>

      {sales.length === 0 ? (
        <Card><EmptyState icon={TrendingUp} title="Waiting for sales..." message="New invoices will show up here in real time" /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {sales.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-brand-500">{s.invoice_number}</span>
                  <span className="text-xs text-slate-400">{timeOnly(s.created_at)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold">{inr(s.total)}</p>
                    <p className="text-xs text-emerald-500">Profit {inr(s.total_profit)}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="capitalize">{s.payment_mode}</p>
                    <p>{s.staff?.full_name}</p>
                    <p>{s.customer?.name || 'Walk-in'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
