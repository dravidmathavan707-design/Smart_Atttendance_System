import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../../components/DashboardLayout.css';

const ROLE_MENU_ITEMS = {
  admin: [
    { id: 'overview', label: 'Dashboard', icon: '◉' },
    { id: 'hods', label: 'Manage HOD', icon: '▬' },
    { id: 'staff', label: 'Manage Staff', icon: '◌' },
    { id: 'students', label: 'Manage Students', icon: '◭' },
    { id: 'reports', label: 'Reports', icon: '◬' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ],
  hod: [
    { id: 'overview', label: 'Dashboard', icon: '◉' },
    { id: 'users', label: 'Department Staff', icon: '▤' },
    { id: 'timetable', label: 'Timetable', icon: '▣' },
    { id: 'attendance-register', label: 'Attendance', icon: '◫' },
    { id: 'reports', label: 'Reports', icon: '◬' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ],
  staff: [
    { id: 'overview', label: 'Dashboard', icon: '◉' },
    { id: 'timetable', label: "Today's Timetable", icon: '▣' },
    { id: 'start-session', label: 'Start Attendance Session', icon: '▶' },
    { id: 'generate-otp', label: 'Generate OTP', icon: '◍' },
    { id: 'invite-students', label: 'Invite Students', icon: '✉' },
    { id: 'attendance-register', label: 'Attendance Register', icon: '▤' },
    { id: 'reports', label: 'Reports', icon: '◬' },
  ],
  master: [
    { id: 'overview', label: 'Dashboard', icon: '◉' },
    { id: 'admins', label: 'Create Admin', icon: '█' },
    { id: 'hods', label: 'Create HOD', icon: '▬' },
    { id: 'staff', label: 'Create Staff', icon: '◌' },
    { id: 'students', label: 'Students', icon: '◭' },
    { id: 'timetable', label: 'Timetable', icon: '▣' },
    { id: 'users', label: 'Users', icon: '▤' },
    { id: 'reports', label: 'Reports', icon: '◬' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ],
};

function ControlUserForm({ form, setForm, feedback, roleLabel, showDepartment = false, departments = [] }) {
  const departmentSuggestions = departments.map((dept) => dept.name);

  return (
    <div className="institution-form">
      <p>Create a {roleLabel} account for your institution.</p>
      <div className="form-grid">
        <label>
          <span>{roleLabel} Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`Ex: ${roleLabel} Name`} />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@institution.edu" />
        </label>
        <label>
          <span>Phone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Secure password" />
        </label>
        {showDepartment && roleLabel !== 'Staff' && (
          <label>
            <span>Department</span>
            <input
              value={form.department_name || ''}
              onChange={(e) => setForm({ ...form, department_name: e.target.value })}
              placeholder="Type department (e.g., CSE, CCE)"
              list={`${roleLabel.toLowerCase()}-departments`}
            />
            <datalist id={`${roleLabel.toLowerCase()}-departments`}>
              {departmentSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
        )}
        {showDepartment && roleLabel === 'Staff' && (
          <label>
            <span>Departments</span>
            <input
              value={form.department_names_text || ''}
              onChange={(e) => setForm({ ...form, department_names_text: e.target.value })}
              placeholder="Type multiple departments (e.g., CSE, CCE)"
              list="staff-departments"
            />
            <datalist id="staff-departments">
              {departmentSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
        )}
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function StudentForm({ form, setForm, feedback, departments = [] }) {
  const departmentSuggestions = departments.map((dept) => dept.name);

  return (
    <div className="institution-form">
      <p>Add a verified student account with login password.</p>
      <div className="form-grid">
        <label>
          <span>Student Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Rahul Kumar" />
        </label>
        <label>
          <span>Student Code</span>
          <input value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} placeholder="Ex: CSE24001" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@institution.edu" />
        </label>
        <label>
          <span>Phone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Student login password" />
        </label>
        <label>
          <span>Department</span>
          <input
            value={form.department_name || ''}
            onChange={(e) => setForm({ ...form, department_name: e.target.value })}
            placeholder="Type department (e.g., CSE, CCE)"
            list="student-departments"
          />
          <datalist id="student-departments">
            {departmentSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function TimetableForm({ form, setForm, feedback, departments = [] }) {
  const departmentSuggestions = departments.map((dept) => dept.name);

  return (
    <div className="institution-form">
      <p>Create timetable entry and start session with reminders.</p>
      <div className="form-grid">
        <label>
          <span>Subject</span>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Data Structures" />
        </label>
        <label>
          <span>Day</span>
          <input value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} placeholder="Ex: Monday" />
        </label>
        <label>
          <span>Start Time</span>
          <input value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} placeholder="09:00" />
        </label>
        <label>
          <span>End Time</span>
          <input value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} placeholder="09:50" />
        </label>
        <label>
          <span>Department</span>
          <input
            value={form.department_name || ''}
            onChange={(e) => setForm({ ...form, department_name: e.target.value })}
            placeholder="Type department (e.g., CSE, CCE)"
            list="timetable-departments"
          />
          <datalist id="timetable-departments">
            {departmentSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function StudentInviteForm({ form, setForm, feedback, departments = [] }) {
  const departmentSuggestions = departments.map((dept) => dept.name);

  return (
    <div className="institution-form">
      <p>Invite students and send invite token.</p>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Student Name" />
        </label>
        <label>
          <span>Student Code</span>
          <input value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} placeholder="Ex: CSE24101" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@institution.edu" />
        </label>
        <label>
          <span>Phone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
        </label>
        <label>
          <span>Department</span>
          <input
            value={form.department_name || ''}
            onChange={(e) => setForm({ ...form, department_name: e.target.value })}
            placeholder="Type department (e.g., CSE)"
            list="invite-departments"
          />
          <datalist id="invite-departments">
            {departmentSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function OtpGenerateForm({ form, setForm, feedback }) {
  return (
    <div className="institution-form">
      <p>Generate OTP for an invite token.</p>
      <div className="form-grid">
        <label>
          <span>Invite Token</span>
          <input
            value={form.invite_token}
            onChange={(e) => setForm({ ...form, invite_token: e.target.value })}
            placeholder="Paste invite token"
          />
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function AttendanceRegisterForm({ form, setForm, feedback }) {
  return (
    <div className="institution-form">
      <p>Load attendance register by session ID.</p>
      <div className="form-grid">
        <label>
          <span>Session ID</span>
          <input
            type="number"
            value={form.session_id || ''}
            onChange={(e) => setForm({ ...form, session_id: parseInt(e.target.value, 10) || 0 })}
            placeholder="Enter active session ID"
          />
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

export default function InstitutionMasterDashboard() {
  const { user } = useAuth();
  const currentRole = (user?.role || 'master').toLowerCase();

  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [adminFeedback, setAdminFeedback] = useState('');
  const [hodForm, setHodForm] = useState({ name: '', email: '', phone: '', password: '', department_name: '' });
  const [hodFeedback, setHodFeedback] = useState('');
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '', department_name: '', department_names_text: '' });
  const [staffFeedback, setStaffFeedback] = useState('');
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', student_code: '', password: '', department_name: '' });
  const [studentFeedback, setStudentFeedback] = useState('');
  const [timetableForm, setTimetableForm] = useState({ subject: '', day_of_week: '', start_time: '', end_time: '', department_name: '' });
  const [timetableFeedback, setTimetableFeedback] = useState('');
  const [inviteForm, setInviteForm] = useState({ name: '', student_code: '', email: '', phone: '', department_name: '' });
  const [inviteFeedback, setInviteFeedback] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [otpForm, setOtpForm] = useState({ invite_token: '' });
  const [otpFeedback, setOtpFeedback] = useState('');
  const [registerForm, setRegisterForm] = useState({ session_id: 0 });
  const [registerFeedback, setRegisterFeedback] = useState('');
  const [attendanceRegister, setAttendanceRegister] = useState(null);
  const [latestSessionId, setLatestSessionId] = useState(null);

  const [controlUsers, setControlUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [usersFeedback, setUsersFeedback] = useState('');
  const [students, setStudents] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);

  const canCreateAdmin = currentRole === 'master';
  const canCreateHod = currentRole === 'master' || currentRole === 'admin';
  const canCreateStaff = currentRole === 'master' || currentRole === 'admin' || currentRole === 'hod';
  const canManageStudents = ['master', 'admin', 'hod', 'staff'].includes(currentRole);
  const canManageTimetable = ['master', 'admin', 'hod', 'staff'].includes(currentRole);
  const canInviteStudents = ['hod', 'staff'].includes(currentRole);

  const csvEscape = (value) => {
    const text = `${value ?? ''}`;
    const escaped = text.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const downloadCsv = (fileName, headers, rows) => {
    if (!rows.length) {
      setUsersFeedback('No records available for CSV export.');
      return;
    }

    const csvLines = [headers.join(',')];
    rows.forEach((row) => {
      csvLines.push(row.map(csvEscape).join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canManageTargetRole = (targetRole) => {
    if (currentRole === 'super_master') return targetRole !== 'super_master';
    if (currentRole === 'master') return ['admin', 'hod', 'staff'].includes(targetRole);
    if (currentRole === 'admin') return ['hod', 'staff'].includes(targetRole);
    if (currentRole === 'hod') return targetRole === 'staff';
    return false;
  };

  const handleUserStatus = async (targetUserId, shouldBeActive) => {
    setUsersFeedback(shouldBeActive ? 'Continuing user...' : 'Suspending user...');
    try {
      await api.patch(`/admin/control-user/${targetUserId}/status`, { is_active: shouldBeActive });
      await loadUsers();
      setUsersFeedback(shouldBeActive ? 'User continued.' : 'User suspended.');
    } catch (error) {
      setUsersFeedback(error.response?.data?.detail || 'Unable to update user status.');
    }
  };

  const handleDeleteUser = async (targetUserId, targetName) => {
    if (!window.confirm(`Delete user account: ${targetName}?`)) {
      return;
    }

    setUsersFeedback('Deleting user...');
    try {
      await api.delete(`/admin/control-user/${targetUserId}`);
      await loadUsers();
      setUsersFeedback('User deleted.');
    } catch (error) {
      setUsersFeedback(error.response?.data?.detail || 'Unable to delete user.');
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      const rows = res.data || [];
      setDepartments(rows);
      const map = {};
      rows.forEach((dept) => {
        map[dept.id] = dept.name;
      });
      setDepartmentMap(map);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get('/admin/list');
      const users = usersRes.data || [];
      setControlUsers(users);

      setStats({
        admins: users.filter((u) => u.role === 'admin').length,
        hods: users.filter((u) => u.role === 'hod').length,
        staff: users.filter((u) => u.role === 'staff').length,
        total: users.length,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadTimetable = async () => {
    try {
      const res = await api.get('/admin/timetable');
      setTimetableEntries(res.data || []);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  const resolveDepartmentId = (name) => {
    const normalized = (name || '').trim().toLowerCase();
    if (!normalized) return null;
    const found = departments.find((dept) => (dept.name || '').trim().toLowerCase() === normalized);
    return found?.id || null;
  };

  const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  const handleStartTimetableSession = async (entryId) => {
    setTimetableFeedback('Starting session and sending reminders...');
    try {
      const pos = await getCurrentLocation();
      const res = await api.post(`/admin/timetable/${entryId}/start-session`, {
        teacher_lat: pos.lat,
        teacher_lng: pos.lng,
        radius_meters: 40,
      });
      setLatestSessionId(res.data.session_id);
      setRegisterForm((prev) => ({ ...prev, session_id: res.data.session_id || prev.session_id }));
      setTimetableFeedback(`✓ ${res.data.message}. Notified students: ${res.data.notified_students}`);
    } catch (error) {
      setTimetableFeedback(error.response?.data?.detail || 'Unable to start session from timetable.');
    }
  };

  useEffect(() => {
    loadDepartments();
    loadUsers();
    loadStudents();
    loadTimetable();
  }, []);

  const handleAction = async (action) => {
    if (action.label === 'Create Admin') {
      setAdminFeedback('Creating admin...');
      try {
        await api.post('/admin/appoint-admin', adminForm);
        setAdminFeedback('✓ Admin created successfully!');
        setAdminForm({ name: '', email: '', phone: '', password: '' });
        await loadUsers();
      } catch (error) {
        setAdminFeedback(error.response?.data?.detail || 'Unable to create admin.');
      }
      return;
    }

    if (action.label === 'Create HOD') {
      setHodFeedback('Creating HOD...');
      if (!hodForm.department_name?.trim()) {
        setHodFeedback('Please type a department name (e.g., CSE).');
        return;
      }
      try {
        await api.post('/admin/appoint-hod', {
          ...hodForm,
          department_name: hodForm.department_name.trim(),
        });
        setHodFeedback('✓ HOD created successfully!');
        setHodForm({ name: '', email: '', phone: '', password: '', department_name: '' });
        await loadDepartments();
        await loadUsers();
      } catch (error) {
        setHodFeedback(error.response?.data?.detail || 'Unable to create HOD.');
      }
      return;
    }

    if (action.label === 'Create Staff') {
      setStaffFeedback('Creating staff...');
      const names = (staffForm.department_names_text || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      if (!names.length && !staffForm.department_name?.trim()) {
        setStaffFeedback('Please type at least one department (e.g., CSE, CCE).');
        return;
      }
      try {
        await api.post('/admin/appoint-staff', {
          ...staffForm,
          department_name: staffForm.department_name?.trim() || undefined,
          department_names: names.length ? names : undefined,
        });
        setStaffFeedback('✓ Staff created successfully with multi-department access!');
        setStaffForm({ name: '', email: '', phone: '', password: '', department_name: '', department_names_text: '' });
        await loadDepartments();
        await loadUsers();
      } catch (error) {
        setStaffFeedback(error.response?.data?.detail || 'Unable to create staff.');
      }
      return;
    }

    if (action.label === 'Refresh') {
      setUsersFeedback('Refreshing users...');
      await loadUsers();
      setUsersFeedback('User list updated.');
      return;
    }

    if (action.label === 'Add Student') {
      setStudentFeedback('Adding student...');
      if (!studentForm.department_name?.trim()) {
        setStudentFeedback('Please type a department name (e.g., CSE).');
        return;
      }
      try {
        await api.post('/admin/students', {
          ...studentForm,
          department_name: studentForm.department_name.trim(),
        });
        setStudentFeedback('✓ Student added and verified for login!');
        setStudentForm({ name: '', email: '', phone: '', student_code: '', password: '', department_name: '' });
        await loadDepartments();
        await loadStudents();
      } catch (error) {
        setStudentFeedback(error.response?.data?.detail || 'Unable to add student.');
      }
      return;
    }

    if (action.label === 'Save Timetable') {
      setTimetableFeedback('Saving timetable...');
      if (!timetableForm.department_name?.trim()) {
        setTimetableFeedback('Please type a department name (e.g., CSE).');
        return;
      }
      try {
        await api.post('/admin/timetable', {
          ...timetableForm,
          department_name: timetableForm.department_name.trim(),
        });
        setTimetableFeedback('✓ Timetable entry saved.');
        setTimetableForm({ subject: '', day_of_week: '', start_time: '', end_time: '', department_name: '' });
        await loadDepartments();
        await loadTimetable();
      } catch (error) {
        setTimetableFeedback(error.response?.data?.detail || 'Unable to save timetable.');
      }
      return;
    }

    if (action.label === 'Refresh Students') {
      setStudentFeedback('Refreshing students...');
      await loadStudents();
      setStudentFeedback('Student list updated.');
      return;
    }

    if (action.label === 'Refresh Timetable') {
      setTimetableFeedback('Refreshing timetable...');
      await loadTimetable();
      setTimetableFeedback('Timetable updated.');
      return;
    }

    if (action.label === 'Invite Student') {
      setInviteFeedback('Sending invite...');
      const departmentId = resolveDepartmentId(inviteForm.department_name);
      if (!departmentId) {
        setInviteFeedback('Department must match an existing department for invite flow.');
        return;
      }
      try {
        const res = await api.post('/otp/invite', {
          name: inviteForm.name,
          student_code: inviteForm.student_code,
          email: inviteForm.email,
          phone: inviteForm.phone,
          department_id: departmentId,
        });
        const token = res.data?.invite_token || '';
        setInviteToken(token);
        setOtpForm({ invite_token: token });
        setInviteFeedback(`✓ Invite sent. Token: ${token}`);
      } catch (error) {
        setInviteFeedback(error.response?.data?.detail || 'Unable to invite student.');
      }
      return;
    }

    if (action.label === 'Generate OTP') {
      setOtpFeedback('Generating OTP...');
      if (!otpForm.invite_token?.trim()) {
        setOtpFeedback('Enter invite token first.');
        return;
      }
      try {
        const res = await api.post(`/otp/request-otp/${otpForm.invite_token.trim()}`);
        setOtpFeedback(`✓ OTP generated for student ID ${res.data.student_id}.`);
      } catch (error) {
        setOtpFeedback(error.response?.data?.detail || 'Unable to generate OTP.');
      }
      return;
    }

    if (action.label === 'Load Register') {
      setRegisterFeedback('Loading attendance register...');
      if (!registerForm.session_id) {
        setRegisterFeedback('Provide a valid session ID.');
        return;
      }
      try {
        const res = await api.get(`/attendance/${registerForm.session_id}/dashboard`);
        setAttendanceRegister(res.data);
        setRegisterFeedback('✓ Attendance register loaded.');
      } catch (error) {
        setAttendanceRegister(null);
        setRegisterFeedback(error.response?.data?.detail || 'Unable to load attendance register.');
      }
      return;
    }

    if (action.label === 'Refresh Reports') {
      await Promise.all([loadUsers(), loadStudents(), loadTimetable()]);
      setUsersFeedback('Reports data refreshed.');
      return;
    }

    if (action.label === 'Download Users CSV') {
      const rows = controlUsers.map((record) => [
        record.id,
        record.name,
        record.email,
        record.role,
        record.department_id ? (departmentMap[record.department_id] || `Department ${record.department_id}`) : '-',
        record.department_ids?.length ? record.department_ids.map((id) => departmentMap[id] || `Department ${id}`).join(' | ') : '-',
        record.is_active ? 'Active' : 'Suspended',
      ]);
      downloadCsv('users-records.csv', ['ID', 'Name', 'Email', 'Role', 'Primary Department', 'Assigned Departments', 'Status'], rows);
      return;
    }

    if (action.label === 'Download Students CSV') {
      const rows = students.map((record) => [
        record.id,
        record.student_code,
        record.name,
        record.email,
        record.phone,
        departmentMap[record.department_id] || `Department ${record.department_id}`,
        record.phone_verified ? 'Yes' : 'No',
        record.is_active ? 'Active' : 'Inactive',
      ]);
      downloadCsv('students-records.csv', ['ID', 'Code', 'Name', 'Email', 'Phone', 'Department', 'Verified', 'Status'], rows);
      return;
    }

    if (action.label === 'Download Timetable CSV') {
      const rows = timetableEntries.map((record) => [
        record.id,
        record.subject,
        record.day_of_week,
        record.start_time,
        record.end_time,
        departmentMap[record.department_id] || `Department ${record.department_id}`,
        record.is_active ? 'Active' : 'Inactive',
      ]);
      downloadCsv('timetable-records.csv', ['ID', 'Subject', 'Day', 'Start Time', 'End Time', 'Department', 'Status'], rows);
      return;
    }

    if (action.label === 'Download Register CSV') {
      const presentRows = (attendanceRegister?.present || []).map((record) => [
        registerForm.session_id,
        record.reg_no,
        record.name,
        'Present',
      ]);
      const absentRows = (attendanceRegister?.absent || []).map((record) => [
        registerForm.session_id,
        record.reg_no,
        record.name,
        'Absent',
      ]);
      const lockRemovedRows = (attendanceRegister?.lock_removed || []).map((record) => [
        registerForm.session_id,
        record.reg_no,
        record.name,
        'Lock Removed',
      ]);
      const rows = [...presentRows, ...absentRows, ...lockRemovedRows];
      downloadCsv('attendance-register.csv', ['Session ID', 'Reg No', 'Name', 'Status'], rows);
      return;
    }

    if (action.label === 'Download Reports CSV') {
      const rows = [
        ['Users', stats.total || 0],
        ['Admins', stats.admins || 0],
        ['HODs', stats.hods || 0],
        ['Staff', stats.staff || 0],
        ['Students', students.length],
        ['Timetable Rows', timetableEntries.length],
        ['Latest Session', latestSessionId || 'None'],
      ];
      downloadCsv('reports-summary.csv', ['Metric', 'Value'], rows);
    }
  };

  const sections = [
    {
      id: 'overview',
      title: 'Institution Overview',
      description: 'Manage your institution team.',
      badge: 'Active',
      stats: [
        { label: 'Admins', value: stats.admins || '0' },
        { label: 'HODs', value: stats.hods || '0' },
        { label: 'Staff', value: stats.staff || '0' },
        { label: 'Total Users', value: stats.total || '0' },
      ],
      body: (
        <div>
          <p>Welcome to your institution control panel. Create and manage your admin team, heads of departments, and staff members here.</p>
        </div>
      ),
      actions: [
        ...(canCreateAdmin ? [{ label: 'Create Admin', icon: '█', targetSection: 'admins' }] : []),
        ...(canCreateHod ? [{ label: 'Create HOD', icon: '▬', targetSection: 'hods' }] : []),
        ...(canCreateStaff ? [{ label: 'Create Staff', icon: '◌', targetSection: 'staff' }] : []),
        ...(canManageStudents ? [{ label: 'Add Student', icon: '◭', targetSection: 'students' }] : []),
        ...(canManageTimetable ? [{ label: 'Save Timetable', icon: '▣', targetSection: 'timetable' }] : []),
        ...(canInviteStudents ? [{ label: 'Invite Student', icon: '✉', targetSection: 'invite-students' }] : []),
      ],
    },
    ...(canCreateAdmin ? [{
      id: 'admins',
      title: 'Create Admin',
      description: 'Create an institution admin.',
      badge: 'Admin',
      stats: [
        { label: 'Admins', value: stats.admins || '0' },
        { label: 'Status', value: 'Active' },
        { label: 'Role', value: 'Management' },
        { label: 'Ready', value: 'Yes' },
      ],
      body: <ControlUserForm form={adminForm} setForm={setAdminForm} feedback={adminFeedback} roleLabel="Admin" showDepartment={false} departments={departments} />,
      actions: [
        { label: 'Create Admin', icon: '✓', targetSection: 'admins' },
      ],
    }] : []),
    ...(canCreateHod ? [{
      id: 'hods',
      title: 'Create HOD',
      description: 'Create a head of department.',
      badge: 'HOD',
      stats: [
        { label: 'HODs', value: stats.hods || '0' },
        { label: 'Status', value: 'Active' },
        { label: 'Role', value: 'Department' },
        { label: 'Ready', value: 'Yes' },
      ],
      body: <ControlUserForm form={hodForm} setForm={setHodForm} feedback={hodFeedback} roleLabel="HOD" showDepartment={true} departments={departments} />,
      actions: [
        { label: 'Create HOD', icon: '✓', targetSection: 'hods' },
      ],
    }] : []),
    ...(canCreateStaff ? [{
      id: 'staff',
      title: 'Create Staff',
      description: 'Create a staff member.',
      badge: 'Staff',
      stats: [
        { label: 'Staff', value: stats.staff || '0' },
        { label: 'Status', value: 'Active' },
        { label: 'Role', value: 'Teaching' },
        { label: 'Ready', value: 'Yes' },
      ],
      body: <ControlUserForm form={staffForm} setForm={setStaffForm} feedback={staffFeedback} roleLabel="Staff" showDepartment={true} departments={departments} />,
      actions: [
        { label: 'Create Staff', icon: '✓', targetSection: 'staff' },
      ],
    }] : []),
    ...(canManageStudents ? [{
      id: 'students',
      title: 'Students',
      description: 'Add student login accounts and view student list.',
      badge: 'Students',
      stats: [
        { label: 'Total Students', value: `${students.length}` },
        { label: 'Verified', value: `${students.filter((s) => s.phone_verified).length}` },
        { label: 'Active', value: `${students.filter((s) => s.is_active).length}` },
        { label: 'Status', value: 'Ready' },
      ],
      body: (
        <div>
          <StudentForm form={studentForm} setForm={setStudentForm} feedback={studentFeedback} departments={departments} />
          <div className="institutions-list">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.student_code}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{departmentMap[student.department_id] || `Department ${student.department_id}`}</td>
                    <td>{student.phone_verified ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
      actions: [
        { label: 'Add Student', icon: '✓', targetSection: 'students' },
        { label: 'Refresh Students', icon: '↺', targetSection: 'students' },
        { label: 'Download Students CSV', icon: '⬇', targetSection: 'students' },
      ],
    }] : []),
    ...(canManageTimetable ? [{
      id: 'timetable',
      title: currentRole === 'staff' ? "Today's Timetable" : 'Timetable & Sessions',
      description: 'Create timetable and start session with student reminders.',
      badge: 'Schedule',
      stats: [
        { label: 'Entries', value: `${timetableEntries.length}` },
        { label: 'Departments', value: `${departments.length}` },
        { label: 'Reminders', value: 'Enabled' },
        { label: 'Status', value: 'Ready' },
      ],
      body: (
        <div>
          <TimetableForm form={timetableForm} setForm={setTimetableForm} feedback={timetableFeedback} departments={departments} />
          <div className="institutions-list">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetableEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.subject}</td>
                    <td>{entry.day_of_week}</td>
                    <td>{entry.start_time} - {entry.end_time}</td>
                    <td>{departmentMap[entry.department_id] || `Department ${entry.department_id}`}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="action-btn table-action-btn"
                          onClick={() => handleStartTimetableSession(entry.id)}
                        >
                          Start Session
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
      actions: [
        { label: 'Save Timetable', icon: '✓', targetSection: 'timetable' },
        { label: 'Start Attendance Session', icon: '▶', targetSection: 'start-session' },
        { label: 'Refresh Timetable', icon: '↺', targetSection: 'timetable' },
        { label: 'Download Timetable CSV', icon: '⬇', targetSection: 'timetable' },
      ],
    }] : []),
    ...(canManageTimetable ? [{
      id: 'start-session',
      title: 'Start Attendance Session',
      description: 'Start a class session from a timetable row and notify students.',
      badge: 'Live',
      stats: [
        { label: 'Timetable Rows', value: `${timetableEntries.length}` },
        { label: 'Latest Session', value: latestSessionId ? `${latestSessionId}` : 'None' },
        { label: 'Reminders', value: 'Enabled' },
        { label: 'Status', value: 'Ready' },
      ],
      body: (
        <div>
          <p>Use the timetable section Start Session button to begin attendance and send reminders.</p>
          <p>{latestSessionId ? `Latest started session ID: ${latestSessionId}` : 'No session started in this login yet.'}</p>
        </div>
      ),
      actions: [
        { label: 'Save Timetable', icon: '▣', targetSection: 'timetable' },
        { label: 'Load Register', icon: '▤', targetSection: 'attendance-register' },
      ],
    }] : []),
    ...(canInviteStudents ? [{
      id: 'invite-students',
      title: 'Invite Students',
      description: 'Send student invite and generate invite token.',
      badge: 'Invite',
      stats: [
        { label: 'Invite Token', value: inviteToken ? 'Ready' : 'Not Generated' },
        { label: 'Role', value: currentRole.toUpperCase() },
        { label: 'Department Scope', value: 'Restricted' },
        { label: 'Status', value: 'Active' },
      ],
      body: <StudentInviteForm form={inviteForm} setForm={setInviteForm} feedback={inviteFeedback} departments={departments} />,
      actions: [
        { label: 'Invite Student', icon: '✓', targetSection: 'invite-students' },
        { label: 'Generate OTP', icon: '◍', targetSection: 'generate-otp' },
      ],
    }] : []),
    ...(canInviteStudents ? [{
      id: 'generate-otp',
      title: 'Generate OTP',
      description: 'Generate OTP using invite token to complete student verification.',
      badge: 'OTP',
      stats: [
        { label: 'Invite Token', value: otpForm.invite_token ? 'Provided' : 'Missing' },
        { label: 'OTP Mode', value: 'On Demand' },
        { label: 'Flow', value: 'Invite -> OTP' },
        { label: 'Status', value: 'Ready' },
      ],
      body: <OtpGenerateForm form={otpForm} setForm={setOtpForm} feedback={otpFeedback} />,
      actions: [
        { label: 'Generate OTP', icon: '✓', targetSection: 'generate-otp' },
      ],
    }] : []),
    {
      id: 'attendance-register',
      title: 'Attendance Register',
      description: 'Load present, absent, and lock-removed register by session ID.',
      badge: 'Register',
      stats: [
        { label: 'Present', value: `${attendanceRegister?.counts?.present || 0}` },
        { label: 'Absent', value: `${attendanceRegister?.counts?.absent || 0}` },
        { label: 'Lock Removed', value: `${attendanceRegister?.counts?.lock_removed || 0}` },
        { label: 'Total', value: `${attendanceRegister?.counts?.total || 0}` },
      ],
      body: (
        <div>
          <AttendanceRegisterForm form={registerForm} setForm={setRegisterForm} feedback={registerFeedback} />
          {attendanceRegister ? (
            <div className="institutions-list">
              <table>
                <thead>
                  <tr>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{attendanceRegister.present?.map((p) => `${p.reg_no} - ${p.name}`).join(', ') || '-'}</td>
                    <td>{attendanceRegister.absent?.map((a) => `${a.reg_no} - ${a.name}`).join(', ') || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ),
      actions: [
        { label: 'Load Register', icon: '✓', targetSection: 'attendance-register' },
        { label: 'Download Register CSV', icon: '⬇', targetSection: 'attendance-register' },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Quick operational summary for users, students, and timetable.',
      badge: 'Insights',
      stats: [
        { label: 'Users', value: `${stats.total || 0}` },
        { label: 'Students', value: `${students.length}` },
        { label: 'Timetable Rows', value: `${timetableEntries.length}` },
        { label: 'Latest Session', value: latestSessionId ? `${latestSessionId}` : 'None' },
      ],
      body: (
        <div>
          <p>Use reports to monitor operations quickly.</p>
          <p>Users: {stats.total || 0}, Students: {students.length}, Timetable Rows: {timetableEntries.length}</p>
        </div>
      ),
      actions: [
        { label: 'Refresh Reports', icon: '↺', targetSection: 'reports' },
        { label: 'Download Reports CSV', icon: '⬇', targetSection: 'reports' },
      ],
    },
    {
      id: 'users',
      title: currentRole === 'hod' ? 'Department Staff' : 'All Users',
      description: 'View all users in your institution.',
      badge: 'Active',
      stats: [
        { label: 'Admins', value: stats.admins || '0' },
        { label: 'HODs', value: stats.hods || '0' },
        { label: 'Staff', value: stats.staff || '0' },
        { label: 'Total', value: stats.total || '0' },
      ],
      body: (
        <div>
          {usersFeedback ? <p className="feedback">{usersFeedback}</p> : null}
          {loading ? (
            <p>Loading users…</p>
          ) : (
            <div className="institutions-list">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {controlUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.department_id ? (departmentMap[user.department_id] || `Department ${user.department_id}`) : '-'}</td>
                      <td>{user.is_active ? 'Active' : 'Suspended'}</td>
                      <td>
                        {canManageTargetRole(user.role) ? (
                          <div className="row-actions">
                            {user.is_active ? (
                              <button
                                type="button"
                                className="action-btn table-action-btn"
                                onClick={() => handleUserStatus(user.id, false)}
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="action-btn table-action-btn"
                                onClick={() => handleUserStatus(user.id, true)}
                              >
                                Unsuspend
                              </button>
                            )}
                            <button
                              type="button"
                              className="action-btn table-action-btn delete-btn"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
      actions: [
        { label: 'Refresh', icon: '↺', targetSection: 'users' },
        { label: 'Download Users CSV', icon: '⬇', targetSection: 'users' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Institution settings and preferences.',
      badge: 'Config',
      stats: [
        { label: 'Theme', value: 'Mono' },
        { label: 'Status', value: 'Active' },
        { label: 'Version', value: 'v1.0' },
        { label: 'Ready', value: 'Yes' },
      ],
      body: (
        <div>
          <p>Manage your institution settings here.</p>
        </div>
      ),
      actions: [
        { label: 'Edit Settings', icon: '⚙', targetSection: 'settings' },
      ],
    },
  ];

  const roleMeta = {
    master: { title: 'Institution Master', subtitle: 'Institution Control', userName: 'Master', userRole: 'Institution Administrator' },
    admin: { title: 'Institution Admin', subtitle: 'Institution Control', userName: 'Admin', userRole: 'Institution Administrator' },
    hod: { title: 'Head of Department', subtitle: 'Department Control', userName: 'HOD', userRole: 'Academic Lead' },
    staff: { title: 'Staff', subtitle: 'Staff Control', userName: 'Staff', userRole: 'Teaching Staff' },
    super_master: { title: 'Super Master', subtitle: 'Institution Control', userName: 'Super Master', userRole: 'System Administrator' },
  };

  const menuItems = ROLE_MENU_ITEMS[currentRole] || ROLE_MENU_ITEMS.master;

  const visibleSectionIds = new Set(menuItems.map((item) => item.id));
  visibleSectionIds.add('overview');
  visibleSectionIds.add('settings');

  const visibleSections = sections.filter((section) => visibleSectionIds.has(section.id));

  const display = roleMeta[currentRole] || roleMeta.master;

  return (
    <DashboardLayout
      title={display.title}
      subtitle={display.subtitle}
      userName={display.userName}
      userRole={display.userRole}
      menuItems={menuItems}
      sections={visibleSections}
      defaultSection="overview"
      onAction={handleAction}
    />
  );
}
