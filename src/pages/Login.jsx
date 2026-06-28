import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Spinner } from '@/components/ui';

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setSession(res.data);
      toast.success(`Welcome back, ${res.data.user.full_name}`);
      // Partner lands directly on Billing/POS; others on the dashboard.
      navigate(res.data.user?.role === 'partner' ? '/pos' : '/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-xl font-extrabold">RK</div>
          <span className="text-xl font-bold">RK Garments</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Run your shop from anywhere.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Smart billing, fraud prevention, live analytics and complete inventory control — all in one cloud system.
          </p>
        </div>
        <p className="text-sm text-brand-200">© {new Date().getFullYear()} RK Garments. All rights reserved.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-xl font-extrabold text-white">RK</div>
          </div>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-slate-400">Enter your credentials to continue</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  className="input pl-9"
                  placeholder="you@rkgarments.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  className="input pl-9 pr-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner /> : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
