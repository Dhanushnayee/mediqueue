import React, { useState } from 'react';
import { api } from '../../services/api';
import { Building2, Mail, Lock, Eye, EyeOff, BadgePercent, ArrowRight, AlertCircle, Phone, User } from 'lucide-react';

interface ReceptionistRegisterProps {
  onSuccessRedirectToLogin: (notice: string, registeredEmail?: string) => void;
  onNavigateToLogin: () => void;
}

export const ReceptionistRegister: React.FC<ReceptionistRegisterProps> = ({
  onSuccessRedirectToLogin,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 ');
  const [employeeId, setEmployeeId] = useState('');
  const [shift, setShift] = useState('Morning (08:00 AM - 04:00 PM)');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.registerReceptionist({
        name,
        email,
        password,
        phone,
        employee_id: employeeId,
        shift,
        gender,
      });

      // Strict requirement: POST-REGISTRATION REDIRECT TO LOGIN PAGE ONLY, NOT DASHBOARD
      onSuccessRedirectToLogin(
        'Receptionist registration submitted! Account status is PENDING approval by Hospital Super Admin. You will be able to log in once granted permission.',
        email
      );
    } catch (err: any) {
      setError(err.message || 'Receptionist registration failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-950">Reception Staff Registration</div>
          <div className="text-[11px] text-amber-700">Approval granted exclusively by Hospital Super Admin</div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Staff Full Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Staff Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff.priya@hospital.com"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Employee ID *</label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. EMP-REC-204"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
            >
              <option value="Morning (08:00 AM - 04:00 PM)">Morning Shift (08:00 AM - 04:00 PM)</option>
              <option value="Evening (04:00 PM - 12:00 AM)">Evening Shift (04:00 PM - 12:00 AM)</option>
              <option value="Night (12:00 AM - 08:00 AM)">Night Shift (12:00 AM - 08:00 AM)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 "
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? (
            <span className="animate-pulse">Submitting Staff Application...</span>
          ) : (
            <>
              <span>Submit Staff Account for Admin Approval</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already approved?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
          >
            Go to Receptionist Login
          </button>
        </p>
      </div>
    </div>
  );
};
