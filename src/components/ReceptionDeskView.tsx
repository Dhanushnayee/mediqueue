import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { api } from '../services/api';
import { User as UserModel } from '../types';
import { 
  Building2, 
  UserPlus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Zap, 
  ArrowRight,
  Clock,
  Stethoscope,
  ShieldCheck,
  XCircle,
  FileBadge,
  Phone,
  Mail,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface ReceptionDeskViewProps {
  onOpenPass: (tokenId: string) => void;
}

export const ReceptionDeskView: React.FC<ReceptionDeskViewProps> = ({ onOpenPass }) => {
  const { 
    departments, 
    doctors,
    tokens, 
    appointments, 
    issueInstantToken, 
    checkInAppointment, 
    setTokenPriority,
    refreshData,
    language 
  } = useQueue();

  // Tab: 'walkin' | 'doctors'
  const [activeSection, setActiveSection] = useState<'walkin' | 'doctors'>('walkin');

  // Pending Doctor Approvals state
  const [pendingDoctors, setPendingDoctors] = useState<UserModel[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Walk-in form state
  const [searchQuery, setSearchQuery] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+91 ');
  const [patientAge, setPatientAge] = useState<number>(30);
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'gen-med');
  const [isEmergency, setIsEmergency] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pending doctors
  const fetchPendingDoctors = async () => {
    try {
      setLoadingStaff(true);
      const res = await api.getPendingStaff();
      // Receptionist sees pending doctors
      setPendingDoctors(res.filter((u) => u.role === 'doctor'));
    } catch {
      // ignore
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const handleApproveDoctor = async (id: string, docName: string) => {
    try {
      await api.approveStaff(id);
      setApprovalFeedback(`Granted login permission to ${docName}. Doctor is now Active!`);
      await fetchPendingDoctors();
      await refreshData();
      setTimeout(() => setApprovalFeedback(null), 5000);
    } catch (err: any) {
      setApprovalFeedback(err.message || 'Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (id: string, docName: string) => {
    try {
      await api.rejectStaff(id);
      setApprovalFeedback(`Declined credential request for ${docName}.`);
      await fetchPendingDoctors();
      await refreshData();
      setTimeout(() => setApprovalFeedback(null), 5000);
    } catch (err: any) {
      setApprovalFeedback(err.message || 'Failed to reject doctor');
    }
  };

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    try {
      const token = await issueInstantToken({
        patientName,
        patientPhone,
        patientAge: Number(patientAge) || 30,
        patientGender,
        departmentId,
        isEmergency,
      });

      setSuccessMessage(`Token ${token.tokenNumber} issued for ${patientName}`);
      setPatientName('');
      setPatientPhone('+91 ');
      setIsEmergency(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      onOpenPass(token.id);
    } catch {
      // error
    }
  };

  const filteredTokens = tokens.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.patientName.toLowerCase().includes(q) ||
      t.tokenNumber.toLowerCase().includes(q) ||
      t.patientPhone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Reception Desk Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/25">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'te' ? 'రిసెప్షన్ & హాస్పిటల్ కంట్రోల్ డెస్క్' : 'Reception & Patient/Doctor Desk'}
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Staff Console
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'te' 
                ? 'రోగుల వాక్-ఇన్ నమోదు మరియు డాక్టర్ ధృవీకరణ & అనుమతులు' 
                : 'Walk-in patient registration, token issuance, and clinical doctor verification'}
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSection('walkin')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'walkin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Walk-in & Queue</span>
          </button>

          <button
            onClick={() => setActiveSection('doctors')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 relative ${
              activeSection === 'doctors'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span>Doctor Approvals</span>
            {pendingDoctors.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingDoctors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {approvalFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{approvalFeedback}</span>
        </div>
      )}

      {/* SECTION 1: DOCTOR APPROVALS & ROSTER */}
      {activeSection === 'doctors' && (
        <div className="space-y-6">
          {/* Pending Doctor Requests Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Pending Doctor Registration Requests
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Receptionists are authorized to verify medical licenses and grant login permissions to Doctors
                  </p>
                </div>
              </div>

              <button
                onClick={fetchPendingDoctors}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh requests"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {loadingStaff ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                Loading pending doctor credentials...
              </div>
            ) : pendingDoctors.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span className="font-medium">No pending doctor requests. All registered physicians are verified!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDoctors.map((doc) => {
                  const dept = departments.find((d) => d.id === doc.department_id);
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900 font-bold">{doc.name}</strong>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                            Pending Review
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-mono">
                            <FileBadge className="w-3.5 h-3.5 text-teal-600" />
                            <strong>License:</strong> {doc.license_number || 'N/A'}
                          </span>
                          <span>·</span>
                          <span><strong>Specialty:</strong> {doc.specialty} ({dept?.name || 'General Medicine'})</span>
                          <span>·</span>
                          <span><strong>Exp:</strong> {doc.experience_years || 5} yrs</span>
                          <span>·</span>
                          <span><strong>Fee:</strong> ₹{doc.consultation_fee || 500}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          <span>{doc.email}</span>
                          {doc.phone && <span>· {doc.phone}</span>}
                          <span>· Applied: {new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveDoctor(doc.id, doc.name)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Grant Permission</span>
                        </button>
                        <button
                          onClick={() => handleRejectDoctor(doc.id, doc.name)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Hospital Doctors Roster */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Active Hospital Doctors Directory ({doctors.length} Physicians)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctors.map((d) => {
                const dept = departments.find((dept) => dept.id === d.departmentId);
                return (
                  <div key={d.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                    <img
                      src={d.photo}
                      alt={d.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold text-slate-900 truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{d.specialty} · {dept?.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {d.roomNumber}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                          ₹{d.consultationFee}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WALK-IN DESK & QUEUE LEDGER */}
      {activeSection === 'walkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Issue Token Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>{language === 'te' ? 'వాక్-ఇన్ రోగి నమోదు' : 'Instant Walk-in Token'}</span>
              </h4>
              <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold">
                Counter Desk
              </span>
            </div>

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegisterWalkIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'te' ? 'రోగి పేరు' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'te' ? 'మొబైల్' : 'Mobile Number'}
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'te' ? 'వయస్సు' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'te' ? 'విభాగం' : 'OPD Department'}
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-semibold"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'te' ? d.nameTe : d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Toggle */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="font-bold text-rose-800">
                  ⚡ Emergency Acuity (Direct High-Priority Token)
                </span>
              </label>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer mt-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{language === 'te' ? 'టోకెన్ జారీ & ప్రింట్ పాస్' : 'Issue Token & Print Pass'}</span>
              </button>
            </form>

            {/* Pending Appointments for Check-in */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Online Bookings Ready for Check-in</span>
              </h5>
              <div className="space-y-2">
                {appointments
                  .filter((a) => a.status === 'confirmed')
                  .slice(0, 3)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900">{apt.patientName}</strong>
                        <div className="text-[10px] text-slate-500">
                          {apt.timeSlot} · {apt.date}
                        </div>
                      </div>
                      <button
                        onClick={() => checkInAppointment(apt.id)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        Check-In
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Live Search and Queue Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                {language === 'te' ? 'క్యూ జాబితా & ట్రాకింగ్' : 'Live Patient Queue Ledger'}
              </h4>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token, name, phone..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2">Token</th>
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTokens.slice(0, 8).map((tok) => {
                    const dept = departments.find((d) => d.id === tok.departmentId);
                    return (
                      <tr key={tok.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-bold font-mono text-indigo-700">
                          {tok.tokenNumber}
                        </td>
                        <td className="py-2.5">
                          <div className="font-bold text-slate-900">{tok.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tok.patientPhone}</div>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[120px]">
                          {dept?.name}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                              tok.status === 'in_consultation'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tok.status === 'called'
                                ? 'bg-amber-100 text-amber-800'
                                : tok.status === 'completed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {tok.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 text-right space-x-1">
                          {tok.status === 'waiting' && !tok.isEmergency && (
                            <button
                              onClick={() => setTokenPriority(tok.id)}
                              className="px-2 py-1 text-[10px] rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors cursor-pointer"
                              title="Emergency Priority Bump"
                            >
                              ⚡ Bump
                            </button>
                          )}
                          <button
                            onClick={() => onOpenPass(tok.id)}
                            className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                          >
                            Pass
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
