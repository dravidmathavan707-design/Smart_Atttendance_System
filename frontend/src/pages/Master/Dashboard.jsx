import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import '../../components/DashboardLayout.css';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'institutions', label: 'Create Institution', icon: '＋' },
  { id: 'institutions-list', label: 'Institutions', icon: '▣' },
  { id: 'masters', label: 'Create Master', icon: '◎' },
  { id: 'admins', label: 'Create Admin', icon: '█' },
  { id: 'hods', label: 'Create HOD', icon: '▬' },
  { id: 'staff', label: 'Create Staff', icon: '◌' },
  { id: 'users', label: 'All Users', icon: '◌' },
  { id: 'reports', label: 'System Reports', icon: '◫' },
  { id: 'logs', label: 'Activity Logs', icon: '◭' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function MasterDashboardContent({ form, setForm, feedback }) {
  return (
    <div className="institution-form">
      <p>Create an institution record with its name, code, domain, and status.</p>
      <div className="form-grid">
        <label>
          <span>Institution Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Anna University" />
        </label>
        <label>
          <span>Code</span>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AU" />
        </label>
        <label>
          <span>Email Domain</span>
          <input value={form.email_domain} onChange={(e) => setForm({ ...form, email_domain: e.target.value })} placeholder="annauniv.edu" />
        </label>
        <label>
          <span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

function ControlUserForm({ form, setForm, feedback, roleLabel, showDepartmentId = false }) {
  return (
    <div className="institution-form">
      <p>Create a {roleLabel} control user account with name, email, phone, and password.</p>
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
        {showDepartmentId && (
          <label>
            <span>Department ID</span>
            <input type="number" value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: parseInt(e.target.value) || 0 })} placeholder="Ex: 5" />
          </label>
        )}
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

export default function MasterDashboard() {
  const [form, setForm] = useState({ name: '', code: '', email_domain: '', type: 'Institution', status: 'active' });
  const [feedback, setFeedback] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [institutionsError, setInstitutionsError] = useState('');

  const [institutionsCount, setInstitutionsCount] = useState(0);
  const [activeMastersCount, setActiveMastersCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const uptime = '99.9%';

  const [masterForm, setMasterForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [masterFeedback, setMasterFeedback] = useState('');
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [adminFeedback, setAdminFeedback] = useState('');
  const [hodForm, setHodForm] = useState({ name: '', email: '', phone: '', password: '', department_id: 0 });
  const [hodFeedback, setHodFeedback] = useState('');
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '', department_id: 0 });
  const [staffFeedback, setStaffFeedback] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoadingInstitutions(true);
      try {
        // fetch aggregated stats
        try {
          const statsRes = await api.get('/admin/stats');
          const s = statsRes.data || {};
          setInstitutionsCount(s.institutions_count || 0);
          setActiveMastersCount(s.active_masters_count || 0);
          setPendingRequestsCount(s.pending_requests_count || 0);
        } catch (sErr) {
          // fallback to older approach if stats endpoint not available
          setInstitutionsCount(0);
          setActiveMastersCount(0);
          setPendingRequestsCount(0);
        }

        // fetch full institution list for the table
        const instRes = await api.get('/admin/institutions');
        const insts = instRes.data || [];
        setInstitutions(insts);
      } catch (err) {
        setInstitutionsError('Unable to load institutions');
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (action) => {
    if (action.label === 'Save Institution') {
      setFeedback('Saving institution...');
      try {
        const response = await api.post('/admin/institutions', form);
        setFeedback(`Institution created: ${response.data.name}`);
      } catch (error) {
        setFeedback('Unable to create institution.');
      }
      return;
    }

    if (action.label === 'Create Master') {
      setMasterFeedback('Creating master...');
      try {
        await api.post('/admin/appoint-master', masterForm);
        setMasterFeedback('Master created successfully!');
        setMasterForm({ name: '', email: '', phone: '', password: '' });
      } catch (error) {
        setMasterFeedback(error.response?.data?.detail || 'Unable to create master.');
      }
      return;
    }

    if (action.label === 'Create Admin') {
      setAdminFeedback('Creating admin...');
      try {
        await api.post('/admin/appoint-admin', adminForm);
        setAdminFeedback('Admin created successfully!');
        setAdminForm({ name: '', email: '', phone: '', password: '' });
      } catch (error) {
        setAdminFeedback(error.response?.data?.detail || 'Unable to create admin.');
      }
      return;
    }

    if (action.label === 'Create HOD') {
      setHodFeedback('Creating HOD...');
      try {
        await api.post('/admin/appoint-hod', hodForm);
        setHodFeedback('HOD created successfully!');
        setHodForm({ name: '', email: '', phone: '', password: '', department_id: 0 });
      } catch (error) {
        setHodFeedback(error.response?.data?.detail || 'Unable to create HOD.');
      }
      return;
    }

    if (action.label === 'Create Staff') {
      setStaffFeedback('Creating staff...');
      try {
        await api.post('/admin/appoint-staff', staffForm);
        setStaffFeedback('Staff created successfully!');
        setStaffForm({ name: '', email: '', phone: '', password: '', department_id: 0 });
      } catch (error) {
        setStaffFeedback(error.response?.data?.detail || 'Unable to create staff.');
      }
      return;
    }
  };

  const sections = [
    {
      id: 'overview',
      title: 'Super Master Overview',
      description: 'Monitor institutions, masters, and platform health from one place.',
      badge: 'Live',
      stats: [
        { label: 'Institutions', value: institutionsCount || '0' },
        { label: 'Active Masters', value: activeMastersCount || '0' },
        { label: 'Pending Requests', value: pendingRequestsCount || '0' },
        { label: 'System Uptime', value: uptime },
      ],
      body: (
        <div>
          <p>This control layer is now tailored for the Super Master role. You can create and manage institutions, assign institution masters, review users, and monitor platform-level activity.</p>
          <p>Use the sidebar to move between the primary system operations.</p>
        </div>
      ),
      actions: [
        { label: 'Create Institution', icon: '＋', targetSection: 'institutions' },
        { label: 'Invite Institution Master', icon: '✉', targetSection: 'masters' },
        { label: 'Review Reports', icon: '▤', targetSection: 'reports' },
      ],
    },
    {
      id: 'institutions',
      title: 'Create Institution',
      description: 'Register a new university, college, or polytechnic.',
      badge: 'New',
      stats: [
        { label: 'This Month', value: '03' },
        { label: 'Open Slots', value: '15' },
        { label: 'Drafts', value: '01' },
        { label: 'Status', value: 'Ready' },
      ],
      body: <MasterDashboardContent form={form} setForm={setForm} feedback={feedback} />,
      actions: [
        { label: 'Save Institution', icon: '✓', targetSection: 'institutions' },
        { label: 'Add Contact', icon: '✎', targetSection: 'institutions' },
        { label: 'Send Welcome', icon: '✉', targetSection: 'masters' },
      ],
    },
    {
      id: 'institutions-list',
      title: 'Institution Directory',
      description: 'Review every active institution and its health.',
      badge: 'Managed',
      stats: [
        { label: 'Total', value: '08' },
        { label: 'Active', value: '06' },
        { label: 'Inactive', value: '02' },
        { label: 'Pending', value: '03' },
      ],
      body: (
        <div>
          <p>The institution list gives the Super Master a system-wide view of all tenants.</p>
          {loadingInstitutions ? (
            <p>Loading institutions…</p>
          ) : institutionsError ? (
            <p className="feedback">{institutionsError}</p>
          ) : (
            <div className="institutions-list">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Domain</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={inst.id}>
                      <td>{inst.name}</td>
                      <td>{inst.code}</td>
                      <td>{inst.email_domain}</td>
                      <td>{inst.type}</td>
                      <td>{inst.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
      actions: [
        { label: 'Open Institution', icon: '▣', targetSection: 'institutions-list' },
        { label: 'Edit Details', icon: '✎', targetSection: 'institutions-list' },
        { label: 'Archive', icon: '▥', targetSection: 'institutions-list' },
      ],
    },
    {
      id: 'masters',
      title: 'Institution Masters',
      description: 'Assign and monitor the leadership contacts at each institution.',
      badge: 'Leadership',
      stats: [
        { label: 'Masters', value: activeMastersCount || '0' },
        { label: 'Awaiting Approval', value: '02' },
        { label: 'Role Sync', value: '100%' },
        { label: 'Last Invite', value: 'Today' },
      ],
      body: <ControlUserForm form={masterForm} setForm={setMasterForm} feedback={masterFeedback} roleLabel="Master" showDepartmentId={false} />,
      actions: [
        { label: 'Create Master', icon: '＋', targetSection: 'masters' },
        { label: 'Reset Access', icon: '↺', targetSection: 'masters' },
        { label: 'Review Profile', icon: '◎', targetSection: 'users' },
      ],
    },
    {
      id: 'admins',
      title: 'Create Admin',
      description: 'Appoint an institution admin control user.',
      badge: 'Admin',
      stats: [
        { label: 'Active Admins', value: '05' },
        { label: 'This Month', value: '02' },
        { label: 'Status', value: 'Ready' },
        { label: 'Role', value: 'System' },
      ],
      body: <ControlUserForm form={adminForm} setForm={setAdminForm} feedback={adminFeedback} roleLabel="Admin" showDepartmentId={false} />,
      actions: [
        { label: 'Create Admin', icon: '＋', targetSection: 'admins' },
        { label: 'Assign Department', icon: '✎', targetSection: 'admins' },
        { label: 'Send Invite', icon: '✉', targetSection: 'admins' },
      ],
    },
    {
      id: 'hods',
      title: 'Create HOD',
      description: 'Appoint a Head of Department control user.',
      badge: 'HOD',
      stats: [
        { label: 'Active HODs', value: '12' },
        { label: 'Departments', value: '08' },
        { label: 'Status', value: 'Ready' },
        { label: 'Sync', value: '100%' },
      ],
      body: <ControlUserForm form={hodForm} setForm={setHodForm} feedback={hodFeedback} roleLabel="HOD" showDepartmentId={true} />,
      actions: [
        { label: 'Create HOD', icon: '＋', targetSection: 'hods' },
        { label: 'Map Department', icon: '▣', targetSection: 'hods' },
        { label: 'Send Invite', icon: '✉', targetSection: 'hods' },
      ],
    },
    {
      id: 'staff',
      title: 'Create Staff',
      description: 'Appoint a staff control user for classroom or department.',
      badge: 'Staff',
      stats: [
        { label: 'Active Staff', value: '34' },
        { label: 'Departments', value: '08' },
        { label: 'Status', value: 'Ready' },
        { label: 'Assigned', value: '100%' },
      ],
      body: <ControlUserForm form={staffForm} setForm={setStaffForm} feedback={staffFeedback} roleLabel="Staff" showDepartmentId={true} />,
      actions: [
        { label: 'Create Staff', icon: '＋', targetSection: 'staff' },
        { label: 'Assign Department', icon: '▣', targetSection: 'staff' },
        { label: 'Send Invite', icon: '✉', targetSection: 'staff' },
      ],
    },
    {
      id: 'users',
      title: 'All Users',
      description: 'Inspect users across the whole platform.',
      badge: 'Platform',
      stats: [
        { label: 'Admins', value: '15' },
        { label: 'HODs', value: '22' },
        { label: 'Staff', value: '86' },
        { label: 'Students', value: '930' },
      ],
      body: (
        <div>
          <p>Use this view to monitor user growth and keep roles aligned with institution boundaries.</p>
          <p>Super Masters can review the broader platform population without leaving the control center.</p>
        </div>
      ),
      actions: [
        { label: 'Export User List', icon: '⇩', targetSection: 'users' },
        { label: 'Review Access', icon: '▤', targetSection: 'users' },
        { label: 'Notify', icon: '✉', targetSection: 'reports' },
      ],
    },
    {
      id: 'reports',
      title: 'System Reports',
      description: 'Review usage, attendance, and operational activity.',
      badge: 'Insights',
      stats: [
        { label: 'Attendance', value: '94%' },
        { label: 'Sessions', value: '182' },
        { label: 'Flagged', value: '08' },
        { label: 'Alerts', value: '03' },
      ],
      body: (
        <div>
          <p>Reports help the Super Master understand adoption, attendance health, and administrative load.</p>
          <p>Future enhancements can connect this panel to live analytics or exportable summaries.</p>
        </div>
      ),
      actions: [
        { label: 'Open Reports', icon: '◫', targetSection: 'reports' },
        { label: 'Export CSV', icon: '⇩', targetSection: 'reports' },
        { label: 'Share', icon: '✉', targetSection: 'reports' },
      ],
    },
    {
      id: 'logs',
      title: 'Activity Logs',
      description: 'Review recent system activity across all institutions.',
      badge: 'Audit',
      stats: [
        { label: 'Today', value: '124' },
        { label: 'This Week', value: '842' },
        { label: 'Critical', value: '02' },
        { label: 'Status', value: 'Healthy' },
      ],
      body: (
        <div>
          <p>Activity logs provide a trace of logins, role changes, institution onboarding, and important actions.</p>
          <p>These are essential for oversight and secure administration.</p>
        </div>
      ),
      actions: [
        { label: 'Inspect Events', icon: '◭', targetSection: 'logs' },
        { label: 'Filter by Date', icon: '⌕', targetSection: 'logs' },
        { label: 'Export', icon: '⇩', targetSection: 'logs' },
      ],
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Adjust platform-wide configuration and preferences.',
      badge: 'Config',
      stats: [
        { label: 'Theme', value: 'Mono' },
        { label: 'Region', value: 'Global' },
        { label: 'Policies', value: 'Active' },
        { label: 'Version', value: 'v1.0' },
      ],
      body: (
        <div>
          <p>These settings support the Super Master in managing the platform experience and rollout.</p>
          <p>You can later expand this area with notification rules, authentication rules, and branding controls.</p>
        </div>
      ),
      actions: [
        { label: 'Edit Preferences', icon: '⚙', targetSection: 'settings' },
        { label: 'Manage Policies', icon: '▤', targetSection: 'settings' },
        { label: 'Save', icon: '✓', targetSection: 'settings' },
      ],
    },
  ];

  return (
    <DashboardLayout
      title="Super Master"
      subtitle="Platform Command Center"
      userName="Super Master"
      userRole="System Administrator"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
      onAction={handleAction}
    />
  );
}
