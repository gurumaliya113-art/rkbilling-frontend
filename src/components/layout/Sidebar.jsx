import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, ReceiptText,
  Users, BarChart3, FileText, ShieldCheck, Radio, Settings as SettingsIcon, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'Billing / POS', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'manager'] },
  { to: '/invoices', label: 'Invoices', icon: ReceiptText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'manager'] },
  { to: '/live', label: 'Live Owner Panel', icon: Radio, roles: ['admin', 'manager'] },
  { to: '/audit', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin', 'manager'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin', 'manager'] },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { user } = useAuthStore();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 font-extrabold text-white">RK</div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">RK Garments</p>
            <p className="text-[11px] text-slate-400">ERP &amp; POS</p>
          </div>
        )}
        <button className="ml-auto md:hidden" onClick={onCloseMobile}>
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-slate-200 p-4 text-xs text-slate-400 dark:border-slate-800">
          <p className="font-semibold text-slate-500 dark:text-slate-300">{user?.full_name}</p>
          <p className="capitalize">{user?.role}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 md:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
