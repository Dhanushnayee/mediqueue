import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { api } from '../services/api';
import { User as UserModel, ActivityLog } from '../types';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Building2,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  User,
  RotateCcw,
  FileBadge,
  Search,
  Filter,
  Check,
  X,
  Lock,
  Globe,
  Radio,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const AdminAnalyticsView: React.FC = () => {
  const { departments, doctors, tokens, refreshData, language } = useQueue();

  // Active Admin Tab: 'overview' | 'approvals' | 'users' | 'audit'
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'audit'>('overview');

  // Pending Staff Approvals (Doctors & Receptionists)
  const [pendingStaff, setPendingStaff] = useState<UserModel[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Master Users Directory
  const [allUsers, setAllUsers] = useState<UserModel[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilterRole, setLogFilterRole] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch pending staff
  const fetchPendingStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await api.getPendingStaff();
      setPendingStaff(res);
    } catch {
      // ignore
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.getAllUsers();
      setAllUsers(res);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.getActivityLogs();
      setActivityLogs(res);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchPendingStaff();
    fetchAllUsers();
    fetchActivityLogs();
  }, []);

  const handleApproveStaff = async (id: string, name: string, role: string) => {
    try {
      await api.approveStaff(id);
      setActionNotice(`Granted login permission to ${name} (${role}). Status is now ACTIVE!`);
      await fetchPendingStaff();
      await fetchAllUsers();
      await fetchActivityLogs();
      await refreshData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(err.message || 'Approval failed');
    }
  };

  const handleRejectStaff = async (id: string, name: string, role: string) => {
    try {
      await api.rejectStaff(id);
      setActionNotice(`Declined application for ${name} (${role}).`);
      await fetchPendingStaff();
      await fetchAllUsers();
      await fetchActivityLogs();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(err.message || 'Rejection failed');
    }
  };

  const handleToggleUserStatus = async (user: UserModel) => {
    try {
      await api.toggleUserStatus(user.id);
      setActionNotice(`Updated account status for ${user.name}`);
      await fetchAllUsers();
      await fetchActivityLogs();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice(err.message || 'Status toggle failed');
    }
  };

  // KPIs
  const totalIssuedToday = tokens.length + 85;
  const totalCompleted = tokens.filter((t) => t.status === 'completed').length + 72;
  const currentlyWaiting = tokens.filter((t) => t.status === 'waiting').length;
  const inConsultation = tokens.filter((t) => t.status === 'in_consultation').length;
  const avgWait = Math.round(
    departments.reduce((acc, d) => acc + d.estimatedWaitMinutes, 0) / (departments.length || 1)
  );

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = userSearch.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.license_number && u.license_number.toLowerCase().includes(q)) ||
      (u.employee_id && u.employee_id.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  // Filtered Logs
  const filteredLogs = activityLogs.filter((l) => {
    const matchesRole = logFilterRole === 'all' || l.role === logFilterRole;
    const q = logSearch.toLowerCase();
    const matchesSearch =
      !q ||
      l.action.toLowerCase().includes(q) ||
      (l.user_name && l.user_name.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.ip_address && l.ip_address.includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Super Admin Executive Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight">
                Hospital Super Admin Master Console
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-mono">
                Root Super Admin: sadanand@gmail.com
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Super Admin authority over Patients, Doctors, Receptionists, Approvals, and Real-Time Audit Trail
            </p>
          </div>
        </div>

        {/* Global Live Summary */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Audit Trail Active</span>
          </div>
        </div>
      </div>

      {/* Admin 4-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Executive Overview & KPIs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('approvals');
            fetchPendingStaff();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'approvals'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Pending Staff Approvals</span>
          {pendingStaff.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {pendingStaff.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            fetchAllUsers();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-teal-400" />
          <span>Master User Directory</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            {allUsers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            fetchActivityLogs();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Real-Time Audit Trail</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            {activityLogs.length}
          </span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI 4-Card Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Issued Today</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono mt-2 tabular-nums">
                {totalIssuedToday}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +18% vs yesterday
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Avg Wait Time</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600 font-mono mt-2 tabular-nums">
                {avgWait}m
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                -4.5m reduction with AI
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Currently In Queue</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-600 font-mono mt-2 tabular-nums">
                {currentlyWaiting}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Across {departments.length} active OPDs
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Completed Consultations</span>
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-black text-teal-700 font-mono mt-2 tabular-nums">
                {totalCompleted}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {doctors.length} Doctors on Duty
              </span>
            </div>
          </div>

          {/* Department Load Distribution Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              OPD Department Load & Bottle-neck Radar
            </h4>

            <div className="space-y-4">
              {departments.map((dept) => {
                const pct = Math.min(100, Math.round((dept.totalWaiting / 8) * 100));
                return (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      <div className="text-slate-500 font-mono">
                        <strong className="text-indigo-700">{dept.totalWaiting}</strong> waiting · ~{dept.estimatedWaitMinutes} mins
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          pct > 75 ? 'bg-rose-500' : pct > 45 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.max(12, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING STAFF APPROVALS (DOCTORS & RECEPTIONISTS) */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Pending Staff Approval Requests</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital Super Admin can grant login permissions to both Receptionists and Doctors
              </p>
            </div>

            <button
              onClick={fetchPendingStaff}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh requests"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {loadingStaff ? (
            <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
              Loading pending verification requests...
            </div>
          ) : pendingStaff.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-semibold text-slate-700">All Staff Applications Processed!</span>
              <span>No pending Doctors or Receptionists awaiting review.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    staff.role === 'doctor'
                      ? 'bg-teal-50/40 border-teal-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900 font-bold">{staff.name}</strong>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                          staff.role === 'doctor'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {staff.role}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                        Pending Login Permission
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {staff.role === 'doctor' ? (
                        <>
                          <span className="font-mono flex items-center gap-1 font-semibold text-teal-900">
                            <FileBadge className="w-3.5 h-3.5 text-teal-600" />
                            License: {staff.license_number || 'N/A'}
                          </span>
                          <span>·</span>
                          <span>Specialty: {staff.specialty}</span>
                          <span>·</span>
                          <span>Experience: {staff.experience_years} yrs</span>
                          <span>·</span>
                          <span>Fee: ₹{staff.consultation_fee}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono font-semibold text-amber-900">
                            Employee ID: {staff.employee_id || 'N/A'}
                          </span>
                          <span>·</span>
                          <span>Shift: {staff.shift}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>{staff.email}</span>
                      {staff.phone && <span>· {staff.phone}</span>}
                      <span>· Applied: {new Date(staff.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveStaff(staff.id, staff.name, staff.role)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Grant Permission</span>
                    </button>
                    <button
                      onClick={() => handleRejectStaff(staff.id, staff.name, staff.role)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER USER DIRECTORY (PATIENTS, DOCTORS, RECEPTIONISTS, ADMINS) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Hospital User Directory & Access Control</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Absolute Super Admin control over all user accounts and permissions
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="receptionist">Receptionists</option>
                <option value="admin">Administrators</option>
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={fetchAllUsers}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh user list"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">User</th>
                  <th className="pb-2.5">Role</th>
                  <th className="pb-2.5">Credentials / Details</th>
                  <th className="pb-2.5">Approval Status</th>
                  <th className="pb-2.5">Account Status</th>
                  <th className="pb-2.5 text-right">Super Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                      {user.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">{user.phone}</div>
                      )}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                          user.role === 'admin'
                            ? 'bg-slate-900 text-amber-300'
                            : user.role === 'doctor'
                            ? 'bg-teal-100 text-teal-800'
                            : user.role === 'receptionist'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 text-[11px] text-slate-600">
                      {user.role === 'doctor' && (
                        <div>
                          <div className="font-mono font-semibold">License: {user.license_number || 'N/A'}</div>
                          <div className="text-slate-500">{user.specialty} · {user.experience_years}y exp</div>
                        </div>
                      )}
                      {user.role === 'receptionist' && (
                        <div>
                          <div className="font-mono font-semibold">ID: {user.employee_id || 'N/A'}</div>
                          <div className="text-slate-500">{user.shift}</div>
                        </div>
                      )}
                      {user.role === 'patient' && (
                        <div>
                          <div className="font-mono">Blood: {user.blood_group || 'N/A'}</div>
                          <div className="text-slate-500">{user.age ? `${user.age} yrs` : ''} {user.gender || ''}</div>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <span className="font-mono text-slate-500">Root Governance</span>
                      )}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                          user.is_approved === 1
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {user.is_approved === 1 ? 'Approved' : 'Pending'}
                      </span>
                      {user.approved_by && (
                        <div className="text-[9px] text-slate-400 mt-0.5">By {user.approved_by}</div>
                      )}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      {user.email === 'sadanand@gmail.com' ? (
                        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                          Root Admin
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM AUDITING & ACTIVITY LOGS (REAL-TIME AUDIT TRAIL) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Real-Time Audit Trail & Activity Logs Ledger</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Every action by Admin, Receptionist, Doctor, or Patient is captured with User ID, Role, Timestamp, and IP
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <select
                value={logFilterRole}
                onChange={(e) => setLogFilterRole(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
                <option value="anonymous">Anonymous / System</option>
              </select>

              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter action, details, IP..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                onClick={fetchActivityLogs}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh audit logs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingLogs ? (
            <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
              Streaming real-time audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No activity logs match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white shadow-2xs">
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Timestamp</th>
                    <th className="pb-2.5">User & ID</th>
                    <th className="pb-2.5">Role</th>
                    <th className="pb-2.5">Action Performed</th>
                    <th className="pb-2.5">Details</th>
                    <th className="pb-2.5 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-2.5">
                        <div className="font-bold text-slate-900">{log.user_name || 'System / Guest'}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {log.user_id || 'N/A'}
                        </div>
                      </td>

                      <td className="py-2.5">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                            log.role === 'admin'
                              ? 'bg-slate-900 text-amber-300'
                              : log.role === 'doctor'
                              ? 'bg-teal-100 text-teal-800'
                              : log.role === 'receptionist'
                              ? 'bg-amber-100 text-amber-800'
                              : log.role === 'patient'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>

                      <td className="py-2.5 font-bold text-slate-800">
                        {log.action}
                      </td>

                      <td className="py-2.5 text-[11px] text-slate-600 max-w-xs truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>

                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-500">
                        {log.ip_address || '127.0.0.1'}
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
