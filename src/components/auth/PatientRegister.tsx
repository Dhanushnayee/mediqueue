import React, { useState } from 'react';
import { api } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff, Phone, Calendar, HeartPulse, ArrowRight, AlertCircle } from 'lucide-react';

interface PatientRegisterProps {
  onSuccessRedirectToLogin: (notice: string, registeredEmail?: string) => void;
  onNavigateToLogin: () => void;
}

export const PatientRegister: React.FC<PatientRegisterProps> = ({
  onSuccessRedirectToLogin,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 ');
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalHistory, setMedicalHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.registerPatient({
        name,
        email,
        password,
        phone,
        age: Number(age) || 28,
        gender,
        blood_group: bloodGroup,
        medical_history: medicalHistory,
      });

      // Strict requirement: POST-REGISTRATION REDIRECT TO LOGIN PAGE ONLY, NOT DASHBOARD
      onSuccessRedirectToLogin(
        'Patient account registered successfully! You can now log in with your credentials.',
        email
      );
    } catch (err: any) {
      setError(err.message || 'Patient registration failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
          <User className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-indigo-950">Patient Registration Form</div>
          <div className="text-[11px] text-indigo-700">Instant registration with immediate login access</div>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Naidu"
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
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
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
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

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 "
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
            >
              <option value="O+">O Positive (O+)</option>
              <option value="O-">O Negative (O-)</option>
              <option value="A+">A Positive (A+)</option>
              <option value="A-">A Negative (A-)</option>
              <option value="B+">B Positive (B+)</option>
              <option value="B-">B Negative (B-)</option>
              <option value="AB+">AB Positive (AB+)</option>
              <option value="AB-">AB Negative (AB-)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Allergies / Notes</label>
            <input
              type="text"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Penicillin allergy"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? (
            <span className="animate-pulse">Creating Account...</span>
          ) : (
            <>
              <span>Complete Patient Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
          >
            Go to Patient Login
          </button>
        </p>
      </div>
    </div>
  );
};
