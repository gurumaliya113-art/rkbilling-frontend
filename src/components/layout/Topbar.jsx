import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, ShoppingCart } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import NotificationBell from './NotificationBell';

export default function Topbar({ onToggleSidebar, onOpenMobile }) {
  const { theme, toggle } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <button className="btn-ghost p-2 md:hidden" onClick={onOpenMobile} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <button className="btn-ghost hidden p-2 md:inline-flex" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <button className="btn-primary hidden sm:inline-flex" onClick={() => navigate('/pos')}>
        <ShoppingCart size={16} /> New Sale
      </button>

      <NotificationBell />

      <button className="btn-ghost p-2" onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      <button
        className="btn-ghost p-2 text-rose-500"
        onClick={() => { logout(); navigate('/login'); }}
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
