import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import '../../components/DashboardLayout.css';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'institutions', label: 'Create Institution', icon: '＋' },
  { id: 'institutions-list', label: 'Institution List', icon: '▣' },
  { id: 'active-masters', label: 'Master List', icon: '◍' },
  { id: 'masters', label: 'Assign Master', icon: '◎' },
  { id: 'reports', label: 'System Reports', icon: '◫' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function InstitutionForm({ form, setForm, feedback }) {
  return (
    <div className="institution-form">
      <p>Create a new institution on the platform.</p>
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

function MasterForm({ form, setForm, feedback }) {
  return (
    <div className="institution-form">
      <p>Appoint an institution master to manage this institution.</p>
      <div className="form-grid">
        <label>
          <span>Master Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Alice Master" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alice@institution.edu" />
        </label>
        <label>
          <span>Phone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Secure password" />
        </label>
        <label>
          <span>Institution ID</span>
          <input
            type="number"
            value={form.institution_id || ''}
            onChange={(e) => setForm({ ...form, institution_id: parseInt(e.target.value) || 0 })}
            placeholder="Ex: 1"
          />
        </label>
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}

export default function SuperMasterDashboard() {
  const [instForm, setInstForm] = useState({ name: '', code: '', email_domain: '', type: 'Institution', status: 'active' });
  const [instFeedback, setInstFeedback] = useState('');
  const [masterForm, setMasterForm] = useState({ name: '', email: '', phone: '', password: '', institution_id: 0 });
  const [masterFeedback, setMasterFeedback] = useState('');
  
  const [institutions, setInstitutions] = useState([]);
  const [masters, setMasters] = useState([]);
  const [institutionsCount, setInstitutionsCount] = useState(0);
  const [activeInstitutionsCount, setActiveInstitutionsCount] = useState(0);
  const [activeMastersCount, setActiveMastersCount] = useState(0);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [listFeedback, setListFeedback] = useState('');
  const [mastersFeedback, setMastersFeedback] = useState('');

  const handleInstitutionStatus = async (institutionId, nextStatus) => {
    setListFeedback(nextStatus === 'active' ? 'Unsuspending institution...' : 'Suspending institution...');
    try {
      await api.patch(`/admin/institutions/${institutionId}/status`, { status: nextStatus });
      await loadDashboardData();
      setListFeedback(nextStatus === 'active' ? 'Institution unsuspended.' : 'Institution suspended.');
    } catch (error) {
      setListFeedback(error.response?.data?.detail || 'Unable to update institution status.');
    }
  };

  const handleDeleteInstitution = async (institutionId, institutionName) => {
    if (!window.confirm(`Delete institution: ${institutionName}?`)) {
      return;
    }

    setListFeedback('Deleting institution...');
    try {
      await api.delete(`/admin/institutions/${institutionId}`);
      await loadDashboardData();
      setListFeedback('Institution deleted.');
    } catch (error) {
      setListFeedback(error.response?.data?.detail || 'Unable to delete institution.');
    }
  };

  const handlePauseOrContinueMaster = async (masterId, shouldBeActive) => {
    setMastersFeedback(shouldBeActive ? 'Continuing master account...' : 'Pausing master account...');
    try {
      await api.patch(`/admin/control-user/${masterId}/status`, { is_active: shouldBeActive });
      await loadDashboardData();
      setMastersFeedback(shouldBeActive ? 'Master account continued.' : 'Master account paused.');
    } catch (error) {
      setMastersFeedback(error.response?.data?.detail || 'Unable to update master status.');
    }
  };

  const handleDeleteMaster = async (masterId, masterName) => {
    if (!window.confirm(`Delete master account: ${masterName}?`)) {
      return;
    }

    setMastersFeedback('Deleting master account...');
    try {
      await api.delete(`/admin/control-user/${masterId}`);
      await loadDashboardData();
      setMastersFeedback('Master account deleted.');
    } catch (error) {
      setMastersFeedback(error.response?.data?.detail || 'Unable to delete master account.');
    }
  };

  const loadDashboardData = async () => {
    setLoadingInstitutions(true);
    try {
      const statsRes = await api.get('/admin/stats');
      const s = statsRes.data || {};
      setInstitutionsCount(s.institutions_count || 0);
      setActiveMastersCount(s.active_masters_count || 0);

      const instRes = await api.get('/admin/institutions');
      const institutionRows = instRes.data || [];
      setInstitutions(institutionRows);
      setActiveInstitutionsCount(institutionRows.filter((inst) => inst.status === 'active').length);

      const usersRes = await api.get('/admin/list');
      const masterRows = (usersRes.data || []).filter((user) => user.role === 'master');
      setMasters(masterRows);
      setActiveMastersCount(masterRows.length);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAction = async (action) => {
    if (action.label === 'Save Institution') {
      setInstFeedback('Creating institution...');
      try {
        const response = await api.post('/admin/institutions', instForm);
        setInstFeedback(`✓ Institution created: ${response.data.name}`);
        setInstForm({ name: '', code: '', email_domain: '', type: 'Institution', status: 'active' });
        await loadDashboardData();
      } catch (error) {
        setInstFeedback(error.response?.data?.detail || 'Unable to create institution.');
      }
      return;
    }

    if (action.label === 'Appoint Master') {
      setMasterFeedback('Creating master...');
      try {
        await api.post('/admin/appoint-master', masterForm);
        setMasterFeedback('✓ Master appointed successfully!');
        setMasterForm({ name: '', email: '', phone: '', password: '', institution_id: 0 });
        await loadDashboardData();
      } catch (error) {
        const detail = error.response?.data?.detail;
        if (detail === 'A control account with this email already exists') {
          setMasterFeedback('This email already exists. Use a different email for a new master account.');
        } else {
          setMasterFeedback(detail || 'Unable to appoint master.');
        }
      }
      return;
    }

    if (action.label === 'Refresh List') {
      setListFeedback('Refreshing institution list...');
      await loadDashboardData();
      setListFeedback('Institution list updated.');
      return;
    }

    if (action.label === 'Refresh Masters') {
      setMastersFeedback('Refreshing master list...');
      await loadDashboardData();
      setMastersFeedback('Master list updated.');
      return;
    }
  };

  const sections = [
    {
      id: 'overview',
      title: 'Platform Overview',
      description: 'Monitor institutions and system status.',
      badge: 'Live',
      stats: [
        { label: 'Institutions', value: institutionsCount || '0', targetSection: 'institutions-list' },
        { label: 'Active Institutions', value: activeInstitutionsCount || '0', targetSection: 'institutions-list' },
        { label: 'Active Masters', value: activeMastersCount || '0', targetSection: 'active-masters' },
        { label: 'System Status', value: 'Healthy' },
      ],
      body: (
        <div>
          <p>Welcome to the Super Master control panel. Use this to manage all institutions and their leadership.</p>
          <p>Create institutions and appoint masters to oversee each one.</p>
        </div>
      ),
      actions: [
        { label: 'Create Institution', icon: '＋', targetSection: 'institutions' },
        { label: 'Appoint Master', icon: '◎', targetSection: 'masters' },
        { label: 'Open Active Masters', icon: '▤', targetSection: 'active-masters' },
      ],
    },
    {
      id: 'institutions',
      title: 'Create Institution',
      description: 'Register a new institution.',
      badge: 'New',
      stats: [
        { label: 'Created', value: institutionsCount || '0' },
        { label: 'Active', value: institutionsCount || '0' },
        { label: 'Status', value: 'Ready' },
        { label: 'Ready', value: 'Yes' },
      ],
      body: <InstitutionForm form={instForm} setForm={setInstForm} feedback={instFeedback} />,
      actions: [
        { label: 'Save Institution', icon: '✓', targetSection: 'institutions' },
      ],
    },
    {
      id: 'institutions-list',
      title: 'Institution List',
      description: 'View all registered institutions in the system.',
      badge: 'Active',
      stats: [
        { label: 'Total Institutions', value: institutionsCount || '0' },
        { label: 'Active Institutions', value: activeInstitutionsCount || '0' },
        { label: 'Institutions With Masters', value: activeMastersCount || '0' },
        { label: 'Sync Status', value: 'Synced' },
      ],
      body: (
        <div>
          <p>Review all institutions and their current status in one place.</p>
          {listFeedback ? <p className="feedback">{listFeedback}</p> : null}
          {loadingInstitutions ? (
            <p>Loading institutions…</p>
          ) : (
            <div className="institutions-list">
              <table>
                <thead>
                  <tr>
                    <th>Count</th>
                    <th>Institution ID</th>
                    <th>Institution Name</th>
                    <th>Institution Code</th>
                    <th>Email Domain</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst, index) => (
                    <tr key={inst.id}>
                      <td>{index + 1}</td>
                      <td>{inst.id}</td>
                      <td>{inst.name}</td>
                      <td>{inst.code}</td>
                      <td>{inst.email_domain}</td>
                      <td>{inst.status}</td>
                      <td>
                        <div className="row-actions">
                          {inst.status === 'active' ? (
                            <button
                              type="button"
                              className="action-btn table-action-btn"
                              onClick={() => handleInstitutionStatus(inst.id, 'inactive')}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="action-btn table-action-btn"
                              onClick={() => handleInstitutionStatus(inst.id, 'active')}
                            >
                              Unsuspend
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn table-action-btn delete-btn"
                            onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                          >
                            Delete
                          </button>
                        </div>
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
        { label: 'Refresh List', icon: '↺', targetSection: 'institutions-list' },
      ],
    },
    {
      id: 'active-masters',
      title: 'Master List',
      description: 'All active institution masters on the platform.',
      badge: 'Leadership',
      stats: [
        { label: 'Active Masters', value: activeMastersCount || '0' },
        { label: 'Institutions', value: institutionsCount || '0' },
        { label: 'Active Institutions', value: activeInstitutionsCount || '0' },
        { label: 'Status', value: 'Synced' },
      ],
      body: (
        <div>
          {mastersFeedback ? <p className="feedback">{mastersFeedback}</p> : null}
          {loadingInstitutions ? (
            <p>Loading active masters…</p>
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
                  {masters.map((master) => (
                    <tr key={master.id}>
                      <td>{master.name}</td>
                      <td>{master.email}</td>
                      <td>{master.role}</td>
                      <td>{master.department_id || '-'}</td>
                      <td>{master.is_active ? 'Active' : 'Paused'}</td>
                      <td>
                        <div className="row-actions">
                        {master.is_active ? (
                          <button
                            type="button"
                            className="action-btn table-action-btn"
                            onClick={() => handlePauseOrContinueMaster(master.id, false)}
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="action-btn table-action-btn"
                            onClick={() => handlePauseOrContinueMaster(master.id, true)}
                          >
                            Continue
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-btn table-action-btn delete-btn"
                          onClick={() => handleDeleteMaster(master.id, master.name)}
                        >
                          Delete
                        </button>
                        </div>
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
        { label: 'Appoint Master', icon: '✓', targetSection: 'masters' },
        { label: 'Open Institutions', icon: '▣', targetSection: 'institutions-list' },
        { label: 'Refresh Masters', icon: '↺', targetSection: 'active-masters' },
      ],
    },
    {
      id: 'masters',
      title: 'Appoint Master',
      description: 'Appoint an institution master.',
      badge: 'Leadership',
      stats: [
        { label: 'Total Masters', value: activeMastersCount || '0' },
        { label: 'Active', value: activeMastersCount || '0' },
        { label: 'Status', value: 'Ready' },
        { label: 'Updated', value: 'Today' },
      ],
      body: <MasterForm form={masterForm} setForm={setMasterForm} feedback={masterFeedback} />,
      actions: [
        { label: 'Appoint Master', icon: '✓', targetSection: 'masters' },
      ],
    },
    {
      id: 'reports',
      title: 'System Reports',
      description: 'Platform statistics and health.',
      badge: 'Insights',
      stats: [
        { label: 'Institutions', value: institutionsCount || '0' },
        { label: 'Masters', value: activeMastersCount || '0' },
        { label: 'Status', value: 'Healthy' },
        { label: 'Uptime', value: '99.9%' },
      ],
      body: (
        <div>
          <p>System is running smoothly. All institutions are synced and operational.</p>
        </div>
      ),
      actions: [
        { label: 'View Reports', icon: '◫', targetSection: 'reports' },
      ],
    },
    {
      id: 'settings',
      title: 'Platform Settings',
      description: 'Configure system preferences.',
      badge: 'Config',
      stats: [
        { label: 'Theme', value: 'Mono' },
        { label: 'Region', value: 'Global' },
        { label: 'Version', value: 'v1.0' },
        { label: 'Status', value: 'Active' },
      ],
      body: (
        <div>
          <p>Platform settings and configuration. Make changes carefully.</p>
        </div>
      ),
      actions: [
        { label: 'Edit Settings', icon: '⚙', targetSection: 'settings' },
      ],
    },
  ];

  return (
    <DashboardLayout
      title="Super Master"
      subtitle="Platform Control"
      userName="Super Master"
      userRole="System Administrator"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
      onAction={handleAction}
    />
  );
}
