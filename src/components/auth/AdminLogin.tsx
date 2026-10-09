import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useQueue();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, 'admin');
    } catch (err: any) {
      setError(err.message || 'Super Admin login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminFill = () => {
    setEmail('sadanand@gmail.com');
    setPassword('sadanand@123');
    setError(null);
  };

  return (
    <div className="space-y-5">
      {/* Role Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Hospital Super Admin Portal</div>
            <div className="text-[11px] text-slate-400">Master governance & real-time audit logs</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSuperAdminFill}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-white/15 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Fill Admin</span>
        </button>
      </div>

      {/* Security notice highlighting seed */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-mono">
        <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
        <div className="text-[11px] leading-tight">
          <strong>Root Super Admin:</strong> sadanand@gmail.com / sadanand@123
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sadanand@gmail.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">Authenticating Admin...</span>
          ) : (
            <>
              <span>Sign In as Super Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Notice: No Admin Registration */}
      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-[11px] text-slate-400 font-medium">
          🔒 Public Admin Registration is Disabled. Admin credentials are provisioned exclusively via backend database seed.
        </p>
      </div>
    </div>
  );
};
