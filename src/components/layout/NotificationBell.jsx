import { useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useNotifications } from '@/hooks/useApi';
import { dateTime } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useNotifications({ unread: true, limit: 10 });
  const items = data?.data || [];
  const count = data?.meta?.total || items.length;

  const markAll = async () => {
    await api.post('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative">
      <button className="btn-ghost relative p-2" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-40 mt-2 w-80 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold">Notifications</span>
              <button className="text-xs text-brand-500" onClick={markAll}>Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">You're all caught up 🎉</p>
              ) : (
                items.map((n) => (
                  <div key={n.id} className="border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-slate-400">{n.message}</p>}
                    <p className="mt-1 text-[10px] text-slate-400">{dateTime(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
