import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { 
  db, 
  hashPassword, 
  verifyPassword, 
  createSession, 
  deleteSession, 
  getSessionUser,
  logActivity
} from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper to extract client IP address
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Auth extraction middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = getSessionUser(token);
    if (user) {
      (req as any).user = user;
      (req as any).sessionToken = token;
    }
  }
  next();
}

app.use(authMiddleware);

// --- 1. USER ROLES & REGISTRATION FLOW ---

// Patient Registration (Active immediately, redirected to login)
app.post('/api/auth/register/patient', (req, res) => {
  try {
    const { name, email, password, phone, age, gender, blood_group, medical_history } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = `usr-pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, phone, age, gender, 
        is_approved, status, blood_group, medical_history, created_at
      ) VALUES (?, ?, ?, ?, 'patient', ?, ?, ?, 1, 'active', ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      cleanEmail,
      passHash,
      phone || null,
      Number(age) || null,
      gender || null,
      blood_group || null,
      medical_history || null,
      new Date().toISOString()
    );

    logActivity(userId, name.trim(), 'patient', 'Patient Registered', `Patient account created: ${cleanEmail}`, getClientIp(req));

    return res.status(201).json({
      success: true,
      role: 'patient',
      message: 'Registration successful! Please log in with your credentials.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Patient registration failed' });
  }
});

// Doctor Registration (Pending approval, blocks login until Admin/Receptionist approves)
app.post('/api/auth/register/doctor', (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      license_number, 
      specialty, 
      department_id = 'gen-med', 
      experience_years = 5, 
      consultation_fee = 500,
      gender
    } = req.body;

    if (!name || !email || !password || !license_number) {
      return res.status(400).json({ error: 'Doctor name, email, password and Medical License Number are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = `usr-doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passHash = hashPassword(password);
    const docId = `doc-${Date.now()}`;

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, phone, gender, 
        doctor_id, department_id, is_approved, status, 
        license_number, specialty, experience_years, consultation_fee, created_at
      ) VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, ?, 0, 'pending', ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      cleanEmail,
      passHash,
      phone || null,
      gender || null,
      docId,
      department_id,
      license_number.trim(),
      specialty || 'General Physician',
      Number(experience_years) || 5,
      Number(consultation_fee) || 500,
      new Date().toISOString()
    );

    logActivity(
      userId, 
      name.trim(), 
      'doctor', 
      'Doctor Registered (Pending Approval)', 
      `License: ${license_number}, Dept: ${department_id}`, 
      getClientIp(req)
    );

    return res.status(201).json({
      success: true,
      role: 'doctor',
      status: 'pending',
      message: 'Doctor application submitted! Your credentials have been routed to Hospital Administration and Reception for clinical verification. You will be able to log in once approved.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Doctor registration failed' });
  }
});

// Receptionist Registration (Pending approval, blocks login until Admin approves)
app.post('/api/auth/register/receptionist', (req, res) => {
  try {
    const { name, email, password, phone, employee_id, shift = 'Morning', desk_number, gender } = req.body;

    if (!name || !email || !password || !employee_id) {
      return res.status(400).json({ error: 'Staff name, email, password and Employee ID are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = `usr-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, phone, gender, 
        is_approved, status, employee_id, shift, created_at
      ) VALUES (?, ?, ?, ?, 'receptionist', ?, ?, 0, 'pending', ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      cleanEmail,
      passHash,
      phone || null,
      gender || null,
      employee_id.trim(),
      shift,
      new Date().toISOString()
    );

    logActivity(
      userId, 
      name.trim(), 
      'receptionist', 
      'Receptionist Registered (Pending Approval)', 
      `Employee ID: ${employee_id}, Shift: ${shift}`, 
      getClientIp(req)
    );

    return res.status(201).json({
      success: true,
      role: 'receptionist',
      status: 'pending',
      message: 'Receptionist registration submitted! Account status is Pending Approval by Hospital Super Admin. You will be able to log in once granted permission.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Receptionist registration failed' });
  }
});

// Generic registration endpoint (blocks Admin registration)
app.post('/api/auth/register', (req, res) => {
  const { role = 'patient' } = req.body;

  if (role === 'admin') {
    logActivity(null, 'Public Guest', 'anonymous', 'Blocked Admin Registration Attempt', 'Attempt to register admin account via frontend', getClientIp(req));
    return res.status(403).json({ error: 'Security Violation: Administrator accounts cannot be created via registration. Only pre-configured Super Admins are permitted.' });
  }

  if (role === 'doctor') {
    return (app as any)._router.handle({ ...req, url: '/api/auth/register/doctor' }, res);
  }
  if (role === 'receptionist') {
    return (app as any)._router.handle({ ...req, url: '/api/auth/register/receptionist' }, res);
  }
  return (app as any)._router.handle({ ...req, url: '/api/auth/register/patient' }, res);
});

// --- 2. AUTHENTICATION / LOGIN WITH APPROVAL VERIFICATION ---

function handleRoleLogin(req: express.Request, res: express.Response, forcedRole?: string) {
  try {
    const { email, password, requiredRole } = req.body;
    const roleToCheck = forcedRole || requiredRole;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    if (!userRow) {
      logActivity(null, cleanEmail, 'anonymous', 'Login Failed', `Account not found for email: ${cleanEmail}`, getClientIp(req));
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = verifyPassword(password, userRow.password_hash);
    if (!isMatch) {
      logActivity(userRow.id, userRow.name, userRow.role, 'Login Failed', `Invalid password attempt for ${cleanEmail}`, getClientIp(req));
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role-specific check if user attempted via dedicated role portal
    if (roleToCheck && roleToCheck !== userRow.role) {
      return res.status(403).json({ 
        error: `Role Mismatch: This portal is for ${roleToCheck}s only. Your account is registered as a ${userRow.role}. Please use the ${userRow.role} login portal.`
      });
    }

    // STRICT APPROVAL CHECK FOR DOCTOR & RECEPTIONIST
    if (userRow.is_approved !== 1 || userRow.status !== 'active') {
      if (userRow.status === 'pending') {
        logActivity(
          userRow.id, 
          userRow.name, 
          userRow.role, 
          'Login Blocked (Pending Approval)', 
          `Unapproved ${userRow.role} tried to log in`, 
          getClientIp(req)
        );
        return res.status(403).json({
          error: userRow.role === 'doctor'
            ? 'Access Denied: Your Doctor account is PENDING APPROVAL from Hospital Administration or Reception. Please check back shortly.'
            : 'Access Denied: Your Staff account is PENDING APPROVAL from Hospital Super Administration. Access will be granted once authorized.',
          status: 'pending',
          role: userRow.role
        });
      }

      if (userRow.status === 'rejected') {
        logActivity(
          userRow.id, 
          userRow.name, 
          userRow.role, 
          'Login Blocked (Rejected Account)', 
          `Rejected ${userRow.role} attempted login`, 
          getClientIp(req)
        );
        return res.status(403).json({
          error: 'Access Denied: Your account registration request was declined by Hospital Administration.',
          status: 'rejected',
          role: userRow.role
        });
      }
    }

    // Successful login: Issue session token
    const token = createSession(userRow.id);
    const user = getSessionUser(token);

    logActivity(
      user.id, 
      user.name, 
      user.role, 
      'User Logged In', 
      `Successful login to ${user.role} console`, 
      getClientIp(req)
    );

    return res.json({ token, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
}

// Separate endpoints for each role
app.post('/api/auth/login/patient', (req, res) => handleRoleLogin(req, res, 'patient'));
app.post('/api/auth/login/doctor', (req, res) => handleRoleLogin(req, res, 'doctor'));
app.post('/api/auth/login/receptionist', (req, res) => handleRoleLogin(req, res, 'receptionist'));
app.post('/api/auth/login/admin', (req, res) => handleRoleLogin(req, res, 'admin'));

// General login endpoint supporting requiredRole
app.post('/api/auth/login', (req, res) => handleRoleLogin(req, res));

app.get('/api/auth/me', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const user = (req as any).user;
  const token = (req as any).sessionToken;
  if (token) {
    deleteSession(token);
  }
  if (user) {
    logActivity(user.id, user.name, user.role, 'User Logged Out', 'Session terminated', getClientIp(req));
  }
  return res.json({ success: true });
});

// --- 3. APPROVAL WORKFLOW & RBAC CONTROLS ---

// Get Pending Registrations
// - Admin sees all pending doctors and receptionists
// - Receptionist sees all pending doctors
app.get('/api/admin/pending-staff', (req, res) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
    return res.status(403).json({ error: 'Unauthorized: Only Admin and Receptionists can review staff requests' });
  }

  if (user.role === 'admin') {
    // Admin sees all pending doctors and receptionists
    const pending = db.prepare(`
      SELECT id, name, email, role, phone, license_number, specialty, 
             experience_years, consultation_fee, employee_id, shift, department_id, 
             is_approved, status, created_at
      FROM users
      WHERE status = 'pending' AND role IN ('doctor', 'receptionist')
      ORDER BY created_at DESC
    `).all();
    return res.json(pending);
  } else {
    // Receptionist sees only pending doctors
    const pending = db.prepare(`
      SELECT id, name, email, role, phone, license_number, specialty, 
             experience_years, consultation_fee, department_id, 
             is_approved, status, created_at
      FROM users
      WHERE status = 'pending' AND role = 'doctor'
      ORDER BY created_at DESC
    `).all();
    return res.json(pending);
  }
});

// Grant Approval (Admin can approve Doctor & Receptionist; Receptionist can approve Doctor)
app.post('/api/admin/users/:id/approve', (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'receptionist')) {
    return res.status(403).json({ error: 'Unauthorized permission' });
  }

  const { id } = req.params;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Receptionist can ONLY approve doctors
  if (currentUser.role === 'receptionist' && targetUser.role !== 'doctor') {
    return res.status(403).json({ error: 'Receptionists are only authorized to verify and approve Doctors' });
  }

  const approvedAt = new Date().toISOString();
  db.prepare(`
    UPDATE users 
    SET is_approved = 1, status = 'active', approved_by = ?, approved_at = ?
    WHERE id = ?
  `).run(currentUser.name, approvedAt, id);

  // If approved user is a Doctor: Ensure doctor record exists in doctors table with OPD room assigned
  if (targetUser.role === 'doctor') {
    const existingDoc = db.prepare('SELECT id FROM doctors WHERE id = ?').get(targetUser.doctor_id || id);
    if (!existingDoc) {
      const roomNum = `Room ${Math.floor(Math.random() * 20) + 101}`;
      db.prepare(`
        INSERT INTO doctors (
          id, name, name_te, specialty, specialty_te, department_id, 
          room_number, experience_years, current_status, photo, 
          rating, consultation_fee, average_mins_per_patient
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, 5.0, ?, 6)
      `).run(
        targetUser.doctor_id || id,
        targetUser.name,
        targetUser.name,
        targetUser.specialty || 'Consultant Physician',
        targetUser.specialty || 'కన్సల్టెంట్ ఫిజిషియన్',
        targetUser.department_id || 'gen-med',
        roomNum,
        targetUser.experience_years || 5,
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
        targetUser.consultation_fee || 500
      );
    }
  }

  logActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    `Approved ${targetUser.role}`,
    `Approved ${targetUser.name} (${targetUser.email}) for active login`,
    getClientIp(req)
  );

  const updated = db.prepare('SELECT id, name, email, role, status, is_approved, approved_by, approved_at FROM users WHERE id = ?').get(id);
  return res.json({ success: true, user: updated });
});

// Reject Registration
app.post('/api/admin/users/:id/reject', (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'receptionist')) {
    return res.status(403).json({ error: 'Unauthorized permission' });
  }

  const { id } = req.params;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (currentUser.role === 'receptionist' && targetUser.role !== 'doctor') {
    return res.status(403).json({ error: 'Receptionists can only decline Doctors' });
  }

  db.prepare(`
    UPDATE users 
    SET is_approved = 0, status = 'rejected', approved_by = ?, approved_at = ?
    WHERE id = ?
  `).run(currentUser.name, new Date().toISOString(), id);

  logActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    `Rejected ${targetUser.role}`,
    `Declined application for ${targetUser.name} (${targetUser.email})`,
    getClientIp(req)
  );

  return res.json({ success: true, message: 'Application rejected' });
});

// Admin: Absolute Super Admin Control over all users (Patients, Doctors, Receptionists)
app.get('/api/admin/users', (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }

  const users = db.prepare(`
    SELECT id, name, email, role, phone, age, gender, 
           is_approved, status, license_number, specialty, 
           employee_id, shift, blood_group, approved_by, approved_at, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();
  return res.json(users);
});

// Admin: Toggle user status (Activate / Deactivate)
app.post('/api/admin/users/:id/toggle-status', (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }

  const { id } = req.params;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent disabling Chief Administrator sadanand@gmail.com
  if (targetUser.email === 'sadanand@gmail.com') {
    return res.status(400).json({ error: 'Root Super Admin cannot be deactivated' });
  }

  const newStatus = targetUser.status === 'active' ? 'rejected' : 'active';
  const newApproved = newStatus === 'active' ? 1 : 0;

  db.prepare('UPDATE users SET status = ?, is_approved = ? WHERE id = ?').run(newStatus, newApproved, id);

  logActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    `Toggled User Status to ${newStatus}`,
    `Changed status for ${targetUser.name} (${targetUser.email}) to ${newStatus}`,
    getClientIp(req)
  );

  const updated = db.prepare('SELECT id, name, email, role, status, is_approved FROM users WHERE id = ?').get(id);
  return res.json(updated);
});

// --- 4. AUDIT TRAIL & ACTIVITY LOGS (Admin View) ---
app.get('/api/admin/activity-logs', (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }

  const logs = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 200').all();
  return res.json(logs);
});

// --- 5. DEPARTMENTS & DOCTORS ---
app.get('/api/departments', (_req, res) => {
  const depts = db.prepare('SELECT * FROM departments').all();
  return res.json(depts);
});

app.get('/api/doctors', (_req, res) => {
  const docs = db.prepare('SELECT * FROM doctors').all();
  return res.json(docs);
});

// --- 6. QUEUE TOKENS & CLINICAL ACTIONS ---
app.get('/api/queue/tokens', (req, res) => {
  const user = (req as any).user;

  if (!user) {
    const publicTokens = db.prepare(`
      SELECT id, token_number, department_id, doctor_id, status, triage_urgency, issued_at, queue_position
      FROM tokens WHERE status IN ('waiting', 'called', 'in_consultation')
      ORDER BY queue_position ASC
    `).all();
    return res.json(publicTokens);
  }

  if (user.role === 'patient') {
    const patientTokens = db.prepare(`
      SELECT * FROM tokens 
      WHERE patient_id = ? OR (patient_phone IS NOT NULL AND patient_phone = ?)
      ORDER BY issued_at DESC
    `).all(user.id, user.phone || '');
    return res.json(patientTokens);
  }

  if (user.role === 'doctor') {
    const docId = user.doctor_id || 'doc-1';
    const deptId = user.department_id || 'gen-med';
    const docTokens = db.prepare(`
      SELECT * FROM tokens 
      WHERE doctor_id = ? OR department_id = ?
      ORDER BY 
        CASE status 
          WHEN 'in_consultation' THEN 1 
          WHEN 'called' THEN 2 
          WHEN 'waiting' THEN 3 
          ELSE 4 
        END, queue_position ASC, issued_at ASC
    `).all(docId, deptId);
    return res.json(docTokens);
  }

  // Receptionist and Admin see all
  const allTokens = db.prepare(`
    SELECT * FROM tokens 
    ORDER BY 
      CASE status 
        WHEN 'in_consultation' THEN 1 
        WHEN 'called' THEN 2 
        WHEN 'waiting' THEN 3 
        ELSE 4 
      END, queue_position ASC, issued_at DESC
  `).all();
  return res.json(allTokens);
});

app.post('/api/queue/tokens', (req, res) => {
  try {
    const user = (req as any).user;
    const { 
      patientName, 
      patientPhone, 
      patientAge, 
      patientGender, 
      departmentId, 
      doctorId, 
      isEmergency, 
      triageUrgency = 'STANDARD', 
      triageSymptoms = [] 
    } = req.body;

    if (!patientName || !departmentId) {
      return res.status(400).json({ error: 'Patient name and department are required' });
    }

    const deptCodeMap: Record<string, string> = {
      'gen-med': 'GM',
      'cardio': 'CD',
      'pediatrics': 'PD',
      'ortho': 'OR',
      'neuro': 'NR',
      'derma': 'SK',
    };
    const prefix = isEmergency ? 'EMG' : deptCodeMap[departmentId] || 'OPD';

    const countInDept = (db.prepare('SELECT count(*) as count FROM tokens WHERE department_id = ?').get(departmentId) as any).count;
    const tokenNumber = `${prefix}-${countInDept + 115}`;

    let finalDocId = doctorId;
    if (!finalDocId) {
      const defaultDoc = db.prepare('SELECT id FROM doctors WHERE department_id = ? LIMIT 1').get(departmentId) as any;
      finalDocId = defaultDoc ? defaultDoc.id : 'doc-1';
    }

    const waitingAhead = (db.prepare(`
      SELECT count(*) as count FROM tokens 
      WHERE department_id = ? AND status = 'waiting'
    `).get(departmentId) as any).count;

    const tokenId = `tok-${Date.now()}`;
    const issuedAt = new Date().toISOString();
    const estCall = new Date(Date.now() + (waitingAhead + 1) * 6 * 60000).toISOString();
    const queuePos = isEmergency ? 1 : waitingAhead + 1;

    db.prepare(`
      INSERT INTO tokens (
        id, token_number, patient_id, patient_name, patient_phone, patient_age, 
        patient_gender, department_id, doctor_id, status, triage_urgency, 
        triage_symptoms, issued_at, estimated_call_time, queue_position, is_emergency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tokenId,
      tokenNumber,
      user?.id || null,
      patientName,
      patientPhone || user?.phone || '+91 91234 56789',
      Number(patientAge) || 28,
      patientGender || 'male',
      departmentId,
      finalDocId,
      'waiting',
      triageUrgency,
      JSON.stringify(triageSymptoms),
      issuedAt,
      estCall,
      queuePos,
      isEmergency ? 1 : 0
    );

    const newWaiting = waitingAhead + 1;
    db.prepare(`
      UPDATE departments 
      SET total_waiting = ?, estimated_wait_minutes = ?
      WHERE id = ?
    `).run(newWaiting, newWaiting * 5, departmentId);

    logActivity(
      user?.id || null,
      user?.name || patientName,
      user?.role || 'patient',
      'Issued OPD Token',
      `Token ${tokenNumber} for ${patientName} (${departmentId})`,
      getClientIp(req)
    );

    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);
    return res.status(201).json(token);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to issue token' });
  }
});

// Doctor calls patient
app.post('/api/queue/tokens/:id/call', (req, res) => {
  const user = (req as any).user;
  if (user && user.role === 'patient') {
    return res.status(403).json({ error: 'Patients cannot call tokens' });
  }

  const { id } = req.params;
  const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id) as any;
  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  db.prepare(`
    UPDATE tokens 
    SET status = 'completed', completed_at = ?
    WHERE doctor_id = ? AND status IN ('in_consultation', 'called')
  `).run(new Date().toISOString(), token.doctor_id);

  db.prepare(`
    UPDATE tokens 
    SET status = 'called', called_at = ?, queue_position = 0
    WHERE id = ?
  `).run(new Date().toISOString(), id);

  db.prepare(`
    UPDATE departments 
    SET current_serving_token = ?
    WHERE id = ?
  `).run(token.token_number, token.department_id);

  logActivity(
    user?.id || null,
    user?.name || 'Doctor',
    user?.role || 'doctor',
    'Called Patient Token',
    `Token ${token.token_number} called to room`,
    getClientIp(req)
  );

  const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
  return res.json(updated);
});

// Doctor completes consultation
app.post('/api/queue/tokens/:id/complete', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { notes } = req.body || {};
  db.prepare(`
    UPDATE tokens 
    SET status = 'completed', completed_at = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(new Date().toISOString(), notes || null, id);

  logActivity(
    user?.id || null,
    user?.name || 'Doctor',
    user?.role || 'doctor',
    'Completed Consultation',
    `Token ID ${id} marked completed. Notes: ${notes ? 'Added Rx' : 'None'}`,
    getClientIp(req)
  );

  const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
  return res.json(updated);
});

// Skip patient
app.post('/api/queue/tokens/:id/skip', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  db.prepare(`
    UPDATE tokens 
    SET status = 'waiting', queue_position = queue_position + 2
    WHERE id = ?
  `).run(id);

  logActivity(user?.id || null, user?.name || 'Doctor', user?.role || 'doctor', 'Skipped Patient', `Token ID ${id} delayed in queue`, getClientIp(req));

  const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
  return res.json(updated);
});

// Delay token (+10 min)
app.post('/api/queue/tokens/:id/delay', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  db.prepare('UPDATE tokens SET queue_position = queue_position + 2 WHERE id = ?').run(id);
  logActivity(user?.id || null, user?.name || 'Patient', user?.role || 'patient', 'Delayed Token', `Token ID ${id} stepped aside (+10m)`, getClientIp(req));
  const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
  return res.json(updated);
});

// Cancel token
app.post('/api/queue/tokens/:id/cancel', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  db.prepare("UPDATE tokens SET status = 'cancelled' WHERE id = ?").run(id);
  logActivity(user?.id || null, user?.name || 'Patient', user?.role || 'patient', 'Cancelled Token', `Token ID ${id} cancelled`, getClientIp(req));
  return res.json({ success: true });
});

// Emergency priority bump
app.post('/api/queue/tokens/:id/priority', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  db.prepare(`
    UPDATE tokens 
    SET is_emergency = 1, triage_urgency = 'CRITICAL', queue_position = 1
    WHERE id = ?
  `).run(id);

  logActivity(user?.id || null, user?.name || 'Staff', user?.role || 'receptionist', 'Priority Bump', `Token ID ${id} bumped to Critical Emergency`, getClientIp(req));

  const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
  return res.json(updated);
});

// Update doctor status
app.post('/api/doctors/:id/status', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { status } = req.body;
  if (!['available', 'in_consultation', 'on_break', 'offline'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE doctors SET current_status = ? WHERE id = ?').run(status, id);

  logActivity(user?.id || null, user?.name || 'Doctor', user?.role || 'doctor', 'Updated Doctor Status', `Doctor ID ${id} status set to ${status}`, getClientIp(req));

  const doc = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
  return res.json(doc);
});

// --- 7. APPOINTMENTS ---
app.get('/api/appointments', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.json([]);
  }

  if (user.role === 'patient') {
    const apts = db.prepare(`
      SELECT * FROM appointments 
      WHERE patient_id = ? OR (patient_phone IS NOT NULL AND patient_phone = ?)
      ORDER BY date ASC, time_slot ASC
    `).all(user.id, user.phone || '');
    return res.json(apts);
  }

  if (user.role === 'doctor') {
    const docId = user.doctor_id || 'doc-1';
    const apts = db.prepare(`
      SELECT * FROM appointments 
      WHERE doctor_id = ?
      ORDER BY date ASC, time_slot ASC
    `).all(docId);
    return res.json(apts);
  }

  const allApts = db.prepare('SELECT * FROM appointments ORDER BY date ASC, time_slot ASC').all();
  return res.json(allApts);
});

app.post('/api/appointments', (req, res) => {
  try {
    const user = (req as any).user;
    const { patientName, patientPhone, doctorId, departmentId, date, timeSlot, reason } = req.body;
    if (!patientName || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'Missing appointment details' });
    }

    const aptId = `apt-${Date.now()}`;
    db.prepare(`
      INSERT INTO appointments (
        id, patient_id, patient_name, patient_phone, doctor_id, 
        department_id, date, time_slot, status, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `).run(
      aptId,
      user?.id || null,
      patientName,
      patientPhone || user?.phone || '+91 91234 56789',
      doctorId,
      departmentId,
      date,
      timeSlot,
      reason || 'General Health Consultation',
      new Date().toISOString()
    );

    logActivity(user?.id || null, user?.name || patientName, user?.role || 'patient', 'Created Appointment', `Appointment on ${date} at ${timeSlot} with ${doctorId}`, getClientIp(req));

    const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(aptId);
    return res.status(201).json(apt);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to book appointment' });
  }
});

app.post('/api/appointments/:id/checkin', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const deptCodeMap: Record<string, string> = {
    'gen-med': 'GM',
    'cardio': 'CD',
    'pediatrics': 'PD',
    'ortho': 'OR',
    'neuro': 'NR',
    'derma': 'SK',
  };
  const prefix = deptCodeMap[apt.department_id] || 'OPD';
  const tokenNumber = `${prefix}-${Math.floor(Math.random() * 50) + 120}`;

  const tokenId = `tok-${Date.now()}`;
  db.prepare(`
    INSERT INTO tokens (
      id, token_number, patient_id, patient_name, patient_phone, patient_age, 
      patient_gender, department_id, doctor_id, status, triage_urgency, 
      issued_at, queue_position
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tokenId,
    tokenNumber,
    apt.patient_id,
    apt.patient_name,
    apt.patient_phone,
    30,
    'male',
    apt.department_id,
    apt.doctor_id,
    'waiting',
    'STANDARD',
    new Date().toISOString(),
    2
  );

  db.prepare(`
    UPDATE appointments 
    SET status = 'checked_in', token_number = ?
    WHERE id = ?
  `).run(tokenNumber, id);

  logActivity(user?.id || null, user?.name || 'Staff', user?.role || 'receptionist', 'Checked In Appointment', `Apt ID ${id} converted to Token ${tokenNumber}`, getClientIp(req));

  const updatedApt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  return res.json({ appointment: updatedApt, tokenId, tokenNumber });
});

// --- 8. NOTIFICATIONS & ANALYTICS ---
app.get('/api/notifications', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    const publicNotifs = db.prepare('SELECT * FROM notifications WHERE user_id IS NULL ORDER BY timestamp DESC LIMIT 10').all();
    return res.json(publicNotifs);
  }

  const notifs = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? OR user_id IS NULL 
    ORDER BY timestamp DESC LIMIT 20
  `).all(user.id);
  return res.json(notifs);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  return res.json({ success: true });
});

app.get('/api/analytics', (req, res) => {
  const totalTokens = (db.prepare('SELECT count(*) as count FROM tokens').get() as any).count + 85;
  const completedTokens = (db.prepare("SELECT count(*) as count FROM tokens WHERE status = 'completed'").get() as any).count + 72;
  const waitingTokens = (db.prepare("SELECT count(*) as count FROM tokens WHERE status = 'waiting'").get() as any).count;
  const activeConsultations = (db.prepare("SELECT count(*) as count FROM tokens WHERE status = 'in_consultation'").get() as any).count;

  const depts = db.prepare('SELECT * FROM departments').all();
  const doctors = db.prepare('SELECT count(*) as count FROM doctors').get() as any;

  return res.json({
    totalTokens,
    completedTokens,
    waitingTokens,
    activeConsultations,
    doctorsOnDuty: doctors.count,
    departments: depts,
  });
});

// --- VITE MIDDLEWARES / STATIC SERVE ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediQueue Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
