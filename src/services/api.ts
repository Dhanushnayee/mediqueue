import { User, QueueToken, Department, Doctor, Appointment, NotificationItem, ActivityLog } from '../types';

const TOKEN_KEY = 'mediqueue_auth_token';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // --- Auth ---
  async login(email: string, password: string, requiredRole?: string): Promise<{ token: string; user: User }> {
    const endpoint = requiredRole ? `/api/auth/login/${requiredRole}` : '/api/auth/login';
    const data = await this.request<{ token: string; user: User }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password, requiredRole }),
    });
    this.setToken(data.token);
    return data;
  }

  async loginPatient(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.login(email, password, 'patient');
  }

  async loginDoctor(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.login(email, password, 'doctor');
  }

  async loginReceptionist(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.login(email, password, 'receptionist');
  }

  async loginAdmin(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.login(email, password, 'admin');
  }

  async registerPatient(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    age?: number;
    gender?: string;
    blood_group?: string;
    medical_history?: string;
  }): Promise<{ success: boolean; message: string; role: string }> {
    return this.request('/api/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async registerDoctor(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    license_number: string;
    specialty: string;
    department_id: string;
    experience_years?: number;
    consultation_fee?: number;
    gender?: string;
  }): Promise<{ success: boolean; message: string; role: string; status: string }> {
    return this.request('/api/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async registerReceptionist(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    employee_id: string;
    shift?: string;
    gender?: string;
  }): Promise<{ success: boolean; message: string; role: string; status: string }> {
    return this.request('/api/auth/register/receptionist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    age?: number;
    gender?: string;
  }): Promise<{ success: boolean; message: string; role: string; user?: User }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe(): Promise<{ user: User } | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      return await this.request<{ user: User }>('/api/auth/me');
    } catch {
      this.setToken(null);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // --- RBAC & Approvals ---
  async getPendingStaff(): Promise<User[]> {
    return this.request<User[]>('/api/admin/pending-staff');
  }

  async approveStaff(userId: string): Promise<{ success: boolean; user: User }> {
    return this.request(`/api/admin/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async rejectStaff(userId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admin/users/${userId}/reject`, {
      method: 'POST',
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/api/admin/users');
  }

  async toggleUserStatus(userId: string): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    });
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.request<ActivityLog[]>('/api/admin/activity-logs');
  }

  // --- Data ---
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/api/departments');
  }

  async getDoctors(): Promise<Doctor[]> {
    return this.request<Doctor[]>('/api/doctors');
  }

  async getTokens(): Promise<QueueToken[]> {
    const rawTokens = await this.request<any[]>('/api/queue/tokens');
    return rawTokens.map(this.mapTokenRow);
  }

  async issueToken(data: {
    patientName: string;
    patientPhone: string;
    patientAge: number;
    patientGender: 'male' | 'female' | 'other';
    departmentId: string;
    doctorId?: string;
    isEmergency?: boolean;
    triageUrgency?: string;
    triageSymptoms?: string[];
  }): Promise<QueueToken> {
    const raw = await this.request<any>('/api/queue/tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapTokenRow(raw);
  }

  async callToken(tokenId: string): Promise<QueueToken> {
    const raw = await this.request<any>(`/api/queue/tokens/${tokenId}/call`, {
      method: 'POST',
    });
    return this.mapTokenRow(raw);
  }

  async completeToken(tokenId: string, notes?: string): Promise<QueueToken> {
    const raw = await this.request<any>(`/api/queue/tokens/${tokenId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return this.mapTokenRow(raw);
  }

  async setTokenPriority(tokenId: string): Promise<QueueToken> {
    const raw = await this.request<any>(`/api/queue/tokens/${tokenId}/priority`, {
      method: 'POST',
    });
    return this.mapTokenRow(raw);
  }

  async setDoctorStatus(doctorId: string, status: string): Promise<Doctor> {
    return this.request<Doctor>(`/api/doctors/${doctorId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async skipToken(tokenId: string): Promise<QueueToken> {
    const raw = await this.request<any>(`/api/queue/tokens/${tokenId}/skip`, {
      method: 'POST',
    });
    return this.mapTokenRow(raw);
  }

  async delayToken(tokenId: string): Promise<QueueToken> {
    const raw = await this.request<any>(`/api/queue/tokens/${tokenId}/delay`, {
      method: 'POST',
    });
    return this.mapTokenRow(raw);
  }

  async cancelToken(tokenId: string): Promise<void> {
    await this.request(`/api/queue/tokens/${tokenId}/cancel`, {
      method: 'POST',
    });
  }

  // --- Appointments ---
  async getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/api/appointments');
  }

  async bookAppointment(data: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    departmentId: string;
    date: string;
    timeSlot: string;
    reason: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkInAppointment(aptId: string): Promise<{ appointment: Appointment; tokenId: string; tokenNumber: string }> {
    return this.request<{ appointment: Appointment; tokenId: string; tokenNumber: string }>(
      `/api/appointments/${aptId}/checkin`,
      { method: 'POST' }
    );
  }

  // --- Notifications ---
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/api/notifications/${id}/read`, { method: 'POST' });
  }

  async getAnalytics(): Promise<any> {
    return this.request<any>('/api/analytics');
  }

  private mapTokenRow(row: any): QueueToken {
    let symptoms: string[] = [];
    if (typeof row.triage_symptoms === 'string') {
      try {
        symptoms = JSON.parse(row.triage_symptoms);
      } catch {
        symptoms = [];
      }
    } else if (Array.isArray(row.triage_symptoms)) {
      symptoms = row.triage_symptoms;
    }

    return {
      id: row.id,
      tokenNumber: row.token_number || row.tokenNumber,
      patientName: row.patient_name || row.patientName,
      patientPhone: row.patient_phone || row.patientPhone,
      patientAge: row.patient_age || row.patientAge || 30,
      patientGender: row.patient_gender || row.patientGender || 'male',
      departmentId: row.department_id || row.departmentId,
      doctorId: row.doctor_id || row.doctorId,
      status: row.status,
      triageUrgency: row.triage_urgency || row.triageUrgency || 'STANDARD',
      triageSymptoms: symptoms,
      issuedAt: row.issued_at || row.issuedAt || new Date().toISOString(),
      estimatedCallTime: row.estimated_call_time || row.estimatedCallTime || '',
      calledAt: row.called_at || row.calledAt,
      completedAt: row.completed_at || row.completedAt,
      queuePosition: row.queue_position !== undefined ? row.queue_position : (row.queuePosition || 1),
      notes: row.notes,
      isEmergency: Boolean(row.is_emergency !== undefined ? row.is_emergency : row.isEmergency),
    };
  }
}

export const api = new ApiService();
