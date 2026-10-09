import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ReceptionistLoginProps {
  onNavigateToRegister: () => void;
  successNotice?: string | null;
}

export const ReceptionistLogin: React.FC<ReceptionistLoginProps> = ({
  onNavigateToRegister,
  successNotice,
}) => {
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
      await login(email, password, 'receptionist');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('reception@mediqueue.com');
    setPassword('reception123');
    setError(null);
  };

  return (
    <div className="space-y-5">
      {/* Role Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-950">Reception & Desk Staff Login</div>
            <div className="text-[11px] text-amber-700">Requires Hospital Super Admin approval</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDemoFill}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 shadow-2xs transition-colors cursor-pointer"
        >
          Quick Demo Fill
        </button>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Staff Official Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reception@mediqueue.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
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
          className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">Authenticating Staff...</span>
          ) : (
            <>
              <span>Sign In to Reception Desk</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          New hospital front-desk staff?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
          >
            Register Receptionist Account
          </button>
        </p>
      </div>
    </div>
  );
};
