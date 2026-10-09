import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useQueue } from '../../context/QueueContext';
import { PatientLogin } from './PatientLogin';
import { PatientRegister } from './PatientRegister';
import { DoctorLogin } from './DoctorLogin';
import { DoctorRegister } from './DoctorRegister';
import { ReceptionistLogin } from './ReceptionistLogin';
import { ReceptionistRegister } from './ReceptionistRegister';
import { AdminLogin } from './AdminLogin';
import { 
  Activity, 
  User, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Languages, 
  CheckCircle2, 
  KeyRound, 
  Sparkles,
  Info
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { language, setLanguage } = useQueue();

  // Active Role Tab
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  // Active View Mode: 'login' | 'register'
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  // Notice banner across redirects
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setNoticeMessage(null);
    if (role === 'admin') {
      setViewMode('login'); // Super Admin has NO registration page
    }
  };

  const handlePostRegistrationRedirect = (notice: string, registeredEmail?: string) => {
    // STRICT REQUIREMENT: POST-REGISTRATION REDIRECT TO LOGIN PAGE ONLY, NOT DASHBOARD
    setViewMode('login');
    setNoticeMessage(notice);
  };

  const roleConfigs = [
    {
      id: 'patient' as UserRole,
      label: 'Patient',
      labelTe: 'రోగి (పేషెంట్)',
      icon: User,
      color: 'indigo',
      badge: 'Immediate Access',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'doctor' as UserRole,
      label: 'Doctor',
      labelTe: 'డాక్టర్ (ఓపీడీ)',
      icon: Stethoscope,
      color: 'teal',
      badge: 'Requires Approval',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'receptionist' as UserRole,
      label: 'Receptionist',
      labelTe: 'రిసెప్షనిస్ట్ (సిబ్బంది)',
      icon: Building2,
      color: 'amber',
      badge: 'Admin Approved',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'admin' as UserRole,
      label: 'Super Admin',
      labelTe: 'సూపర్ అడ్మిన్',
      icon: ShieldCheck,
      color: 'slate',
      badge: 'Pre-Seeded Root',
      badgeColor: 'bg-slate-900 text-amber-300 border-slate-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.4),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.3),transparent_50%)]" />

      {/* Top Bar with Brand & Language Switcher */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">MediQueue AI</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/80">
                RBAC v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Role-Based Access Control & Clinical Queue Governance
            </p>
          </div>
        </div>

        <button
          onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Languages className="w-4 h-4 text-indigo-400" />
          <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-xl mx-auto w-full my-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
          {/* Role Navigation Selector */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Role Portal
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roleConfigs.map((rc) => {
                const Icon = rc.icon;
                const isSelected = selectedRole === rc.id;
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => handleRoleChange(rc.id)}
                    className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{rc.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {language === 'te' ? rc.labelTe : rc.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-View Switcher: Login / Register (Hidden for Admin) */}
          {selectedRole !== 'admin' ? (
            <div className="flex items-center justify-between p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setNoticeMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  viewMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In ({roleConfigs.find((r) => r.id === selectedRole)?.label})
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('register');
                  setNoticeMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  viewMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account ({roleConfigs.find((r) => r.id === selectedRole)?.label})
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
              <span className="font-semibold">Super Admin Master Access Console</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                Seeded In Database
              </span>
            </div>
          )}

          {/* Render Active View Component */}
          <div className="transition-all duration-200">
            {selectedRole === 'patient' && (
              <>
                {viewMode === 'login' ? (
                  <PatientLogin
                    onNavigateToRegister={() => {
                      setViewMode('register');
                      setNoticeMessage(null);
                    }}
                    successNotice={noticeMessage}
                  />
                ) : (
                  <PatientRegister
                    onSuccessRedirectToLogin={handlePostRegistrationRedirect}
                    onNavigateToLogin={() => {
                      setViewMode('login');
                      setNoticeMessage(null);
                    }}
                  />
                )}
              </>
            )}

            {selectedRole === 'doctor' && (
              <>
                {viewMode === 'login' ? (
                  <DoctorLogin
                    onNavigateToRegister={() => {
                      setViewMode('register');
                      setNoticeMessage(null);
                    }}
                    successNotice={noticeMessage}
                  />
                ) : (
                  <DoctorRegister
                    onSuccessRedirectToLogin={handlePostRegistrationRedirect}
                    onNavigateToLogin={() => {
                      setViewMode('login');
                      setNoticeMessage(null);
                    }}
                  />
                )}
              </>
            )}

            {selectedRole === 'receptionist' && (
              <>
                {viewMode === 'login' ? (
                  <ReceptionistLogin
                    onNavigateToRegister={() => {
                      setViewMode('register');
                      setNoticeMessage(null);
                    }}
                    successNotice={noticeMessage}
                  />
                ) : (
                  <ReceptionistRegister
                    onSuccessRedirectToLogin={handlePostRegistrationRedirect}
                    onNavigateToLogin={() => {
                      setViewMode('login');
                      setNoticeMessage(null);
                    }}
                  />
                )}
              </>
            )}

            {selectedRole === 'admin' && <AdminLogin />}
          </div>

          {/* Role Policy Summary */}
          <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              {selectedRole === 'patient' &&
                'Patients activate instantly upon registration. No approval wait required.'}
              {selectedRole === 'doctor' &&
                'Doctor registrations default to Pending and require approval from either Admin or Receptionist before login is granted.'}
              {selectedRole === 'receptionist' &&
                'Receptionist accounts require direct activation from the Hospital Super Administrator.'}
              {selectedRole === 'admin' &&
                'Admin credentials cannot be registered via UI; they are secured and seeded directly into the backend database.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-400 py-4">
        <span>MediQueue AI Smart Hospital Queue Management · NABH & ESI Triage Compliant</span>
      </footer>
    </div>
  );
};
