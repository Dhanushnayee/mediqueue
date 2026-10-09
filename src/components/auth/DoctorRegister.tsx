import React, { useState } from 'react';
import { api } from '../../services/api';
import { Stethoscope, Mail, Lock, Eye, EyeOff, FileBadge, ArrowRight, AlertCircle, Building2, Phone } from 'lucide-react';

interface DoctorRegisterProps {
  onSuccessRedirectToLogin: (notice: string, registeredEmail?: string) => void;
  onNavigateToLogin: () => void;
}

export const DoctorRegister: React.FC<DoctorRegisterProps> = ({
  onSuccessRedirectToLogin,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 ');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialty, setSpecialty] = useState('Senior Physician');
  const [departmentId, setDepartmentId] = useState('gen-med');
  const [experienceYears, setExperienceYears] = useState<number>(8);
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.registerDoctor({
        name,
        email,
        password,
        phone,
        license_number: licenseNumber,
        specialty,
        department_id: departmentId,
        experience_years: Number(experienceYears),
        consultation_fee: Number(consultationFee),
        gender,
      });

      // Strict requirement: POST-REGISTRATION REDIRECT TO LOGIN PAGE ONLY, NOT DASHBOARD
      onSuccessRedirectToLogin(
        'Doctor application submitted! Your credentials have been routed to Hospital Administration and Reception for clinical verification. Your account status is PENDING approval. Once approved, you can log in.',
        email
      );
    } catch (err: any) {
      setError(err.message || 'Doctor application submission failed. Please verify all details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
          <Stethoscope className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-teal-950">Doctor Credential Application</div>
          <div className="text-[11px] text-teal-700">Routed to Admin & Reception dashboards for approval</div>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name (with Title) *</label>
          <div className="relative">
            <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Rao, MD"
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Doctor Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor.rao@hospital.com"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
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
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Medical License / MCI Number *</label>
            <div className="relative">
              <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. MCI-2015-99882"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Specialty *</label>
            <input
              type="text"
              required
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Consultant Cardiologist"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
            >
              <option value="gen-med">General Medicine</option>
              <option value="cardio">Cardiology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="ortho">Orthopedics</option>
              <option value="neuro">Neurology</option>
              <option value="derma">Dermatology</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Consult Fee (₹)</label>
            <input
              type="number"
              step={50}
              min={100}
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-slate-900"
            />
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
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
          className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? (
            <span className="animate-pulse">Submitting Application...</span>
          ) : (
            <>
              <span>Submit Doctor Application for Review</span>
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
            className="font-bold text-teal-700 hover:text-teal-900 underline underline-offset-2 cursor-pointer"
          >
            Go to Doctor Login
          </button>
        </p>
      </div>
    </div>
  );
};
