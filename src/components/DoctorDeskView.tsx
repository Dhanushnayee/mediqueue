import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { 
  Stethoscope, 
  Users, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Phone,
  FileText,
  Calendar,
  Zap,
  Check
} from 'lucide-react';

export const DoctorDeskView: React.FC = () => {
  const { 
    currentUser,
    doctors, 
    departments, 
    tokens, 
    appointments,
    activeDoctorId, 
    setActiveDoctorId, 
    callNextPatient, 
    completeConsultation, 
    skipPatient,
    setDoctorStatus,
    announceCurrentToken,
    checkInAppointment,
    language 
  } = useQueue();

  // If currentUser is a doctor, default to their doctor record
  const currentDocRecord = currentUser?.doctor_id 
    ? doctors.find((d) => d.id === currentUser.doctor_id) 
    : null;

  const doctor = currentDocRecord || doctors.find((d) => d.id === activeDoctorId) || doctors[0] || {
    id: 'doc-1',
    name: currentUser?.name || 'Dr. Physician',
    nameTe: currentUser?.name || 'డాక్టర్',
    specialty: currentUser?.specialty || 'Consultant Physician',
    specialtyTe: 'కన్సల్టెంట్ ఫిజిషియన్',
    departmentId: currentUser?.department_id || 'gen-med',
    roomNumber: 'Room 102',
    currentStatus: 'available' as const,
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    rating: 4.9,
    consultationFee: currentUser?.consultation_fee || 500,
    averageMinsPerPatient: 6,
  };

  const dept = departments.find((d) => d.id === doctor.departmentId);

  // Sub-tab: 'desk' | 'appointments'
  const [activeTab, setActiveTab] = useState<'desk' | 'appointments'>('desk');

  // Find currently active patient for this doctor
  const currentToken = tokens.find(
    (t) => (t.doctorId === doctor.id || t.departmentId === doctor.departmentId) &&
      (t.status === 'in_consultation' || t.status === 'called')
  );

  // Find waiting queue for this doctor / department
  const waitingTokens = tokens.filter(
    (t) => (t.doctorId === doctor.id || t.departmentId === doctor.departmentId) && t.status === 'waiting'
  );

  // Recently completed tokens
  const completedTokens = tokens.filter(
    (t) => (t.doctorId === doctor.id || t.departmentId === doctor.departmentId) && t.status === 'completed'
  );

  // Specific appointments assigned to this doctor
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === doctor.id || (currentUser?.doctor_id && a.doctorId === currentUser.doctor_id)
  );

  const [clinicalNotes, setClinicalNotes] = useState('');

  const handleCallNext = async () => {
    await callNextPatient(doctor.id);
  };

  const handleComplete = async () => {
    if (currentToken) {
      await completeConsultation(currentToken.id, clinicalNotes);
      setClinicalNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Doctor Details & Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 overflow-hidden shrink-0">
            <img
              src={doctor.photo}
              alt={doctor.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'te' ? doctor.nameTe : doctor.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {doctor.roomNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'te' ? doctor.specialtyTe : doctor.specialty} · {language === 'te' ? dept?.nameTe : dept?.name}
            </p>
          </div>
        </div>

        {/* Doctor Switcher & Duty Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Duty Status */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setDoctorStatus(doctor.id, 'available')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                doctor.currentStatus === 'available'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ● On Duty
            </button>
            <button
              type="button"
              onClick={() => setDoctorStatus(doctor.id, 'on_break')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                doctor.currentStatus === 'on_break'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☕ Break
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('desk')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'desk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              OPD Queue Desk
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Assigned Appointments</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-mono">
                {doctorAppointments.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: OPD CONSULTATION DESK */}
      {activeTab === 'desk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Consultation Console */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    {language === 'te' ? 'ప్రస్తుత కన్సల్టేషన్' : 'Active Patient In Consultation'}
                  </h4>
                </div>
                {currentToken && (
                  <button
                    onClick={() => announceCurrentToken(currentToken.id)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{language === 'te' ? 'తిరిగి పిలవండి' : 'Re-announce'}</span>
                  </button>
                )}
              </div>

              {currentToken ? (
                <div className="mt-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <div>
                      <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                        {language === 'te' ? 'కాల్ చేసిన టోకెన్' : 'Token'}
                      </span>
                      <div className="text-4xl font-black text-indigo-950 font-mono">
                        {currentToken.tokenNumber}
                      </div>
                    </div>

                    <div className="space-y-1 text-right sm:text-right">
                      <div className="text-base font-bold text-slate-900">
                        {currentToken.patientName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {currentToken.patientAge}y · {currentToken.patientGender} · {currentToken.patientPhone}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          currentToken.triageUrgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : currentToken.triageUrgency === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Acuity: {currentToken.triageUrgency}
                      </span>
                    </div>
                  </div>

                  {/* Symptoms / Complaints */}
                  {currentToken.triageSymptoms && currentToken.triageSymptoms.length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        {language === 'te' ? 'లక్షణాలు / సమస్యలు' : 'Reported Symptoms'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentToken.triageSymptoms.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Doctor Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'te' ? 'డాక్టర్ కన్సల్టేషన్ నోట్స్ / ప్రిస్క్రిప్షన్' : 'Quick Prescription / Doctor Notes'}
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Enter diagnostic impression, Rx, or advice..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Desk Control Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'te' ? 'కన్సల్టేషన్ పూర్తయింది' : 'Finish & Next'}</span>
                    </button>

                    <button
                      onClick={() => skipPatient(currentToken.id)}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>{language === 'te' ? 'రోగి రాలేదు / దాటవేయి' : 'Skip / Patient Away'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-slate-800">
                      {language === 'te' ? 'గది ప్రస్తుతం ఖాళీగా ఉంది' : 'Room Currently Available'}
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {language === 'te'
                        ? 'తదుపరి వేచి ఉన్న రోగిని పిలవడానికి క్రింది బటన్ నొక్కండి.'
                        : 'No patient in consultation right now. Click below to call the next waiting token.'}
                    </p>
                  </div>

                  <button
                    onClick={handleCallNext}
                    disabled={waitingTokens.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {language === 'te'
                        ? `తదుపరి రోగిని పిలవండి (${waitingTokens.length} వేచి ఉన్నారు)`
                        : `Call Next Patient (${waitingTokens.length} waiting)`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Queue List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'te' ? 'వేచి ఉన్న క్యూ' : 'Waiting Queue'}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {waitingTokens.length} {language === 'te' ? 'మంది' : 'patients'}
                </span>
              </div>

              {waitingTokens.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'te' ? 'క్యూలో ఎవరూ వేచి లేరు' : 'Queue is completely clear!'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {waitingTokens.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[11px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{t.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {t.tokenNumber} · {t.patientAge}y
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            t.triageUrgency === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : t.triageUrgency === 'URGENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.triageUrgency}
                        </span>
                        <button
                          onClick={() => announceCurrentToken(t.id)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600"
                          title="Announce token"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Doctor Summary stats */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'te' ? 'నేటి కౌంటర్ సారాంశం' : "Today's OPD Throughput"}
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-[11px] block">{language === 'te' ? 'పూర్తయిన సంఖ్య' : 'Completed'}</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {completedTokens.length + 8}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-[11px] block">{language === 'te' ? 'సగటు సమయం' : 'Avg Speed'}</span>
                  <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">
                    {doctor.averageMinsPerPatient} mins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DOCTOR SPECIFIC ASSIGNED APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Appointments Booked Specifically with {doctor.name}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-scheduled consultation slots assigned to your OPD clinical desk
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {doctorAppointments.length} Bookings
            </span>
          </div>

          {doctorAppointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No pre-scheduled appointments booked for your desk today. Walk-in tokens will appear in your OPD queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Date & Slot</th>
                    <th className="pb-2.5">Patient Details</th>
                    <th className="pb-2.5">Chief Complaint / Reason</th>
                    <th className="pb-2.5">Token / Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono">
                        <div className="font-bold text-slate-900">{apt.timeSlot}</div>
                        <div className="text-[10px] text-slate-500">{apt.date}</div>
                      </td>

                      <td className="py-3">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{apt.patientPhone}</div>
                      </td>

                      <td className="py-3 text-slate-600 max-w-xs truncate" title={apt.reason}>
                        {apt.reason || 'General Health Consultation'}
                      </td>

                      <td className="py-3">
                        {apt.tokenNumber ? (
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {apt.tokenNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {apt.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        {apt.status === 'confirmed' ? (
                          <button
                            onClick={() => checkInAppointment(apt.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                          >
                            Check-In to Desk
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Checked In
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
