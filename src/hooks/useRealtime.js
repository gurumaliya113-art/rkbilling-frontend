import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

/**
 * Subscribe to Supabase Realtime for this shop's notifications + invoices.
 * On insert: refresh relevant queries and show a toast. Powers the live
 * owner panel and dashboards without polling.
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const shopId = useAuthStore((s) => s.user?.shop_id);

  useEffect(() => {
    if (!supabase || !shopId) return;

    const channel = supabase
      .channel(`shop-${shopId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const n = payload.new;
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          if (n.type === 'sale_created') queryClient.invalidateQueries({ queryKey: ['live-sales'] });
          const icon = n.type === 'high_value_sale' ? '💰' : n.type === 'low_stock' ? '⚠️' : '🔔';
          toast(`${icon} ${n.title}${n.message ? ' — ' + n.message : ''}`);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices', filter: `shop_id=eq.${shopId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['live-sales'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, queryClient]);
}
