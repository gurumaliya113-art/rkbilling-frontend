import { motion } from 'framer-motion';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-500/10 text-brand-500',
    green: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500',
    violet: 'bg-violet-500/10 text-violet-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${accents[accent]}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    blue: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  };
  return <span className={`badge ${map[color]}`}>{children}</span>;
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="mb-3 text-slate-300 dark:text-slate-600" size={48} />}
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-400">{message}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`card relative z-10 w-full ${widths[size]} max-h-[90vh] overflow-auto p-6`}
      >
        {title && <h3 className="mb-4 text-lg font-bold">{title}</h3>}
        {children}
      </motion.div>
    </div>
  );
}
