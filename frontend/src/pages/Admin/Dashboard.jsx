import DashboardLayout from '../../components/DashboardLayout';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'hods', label: 'HOD Management', icon: '◎' },
  { id: 'staff', label: 'Staff Management', icon: '◌' },
  { id: 'departments', label: 'Departments', icon: '▣' },
  { id: 'students', label: 'Students', icon: '◭' },
  { id: 'attendance', label: 'Attendance', icon: '◫' },
  { id: 'reports', label: 'Reports', icon: '◬' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const sections = [
  {
    id: 'overview',
    title: 'Institution Administration',
    description: 'Coordinate departments, staff, and student operations.',
    badge: 'Live',
    stats: [
      { label: 'Departments', value: '06' },
      { label: 'Staff', value: '24' },
      { label: 'Students', value: '480' },
      { label: 'Attendance', value: '92%' },
    ],
    body: <div><p>Your institution-level admin area is now organized for daily operations.</p></div>,
    actions: [
      { label: 'Create HOD', icon: '＋', targetSection: 'hods' },
      { label: 'Manage Staff', icon: '◌', targetSection: 'staff' },
      { label: 'Review Reports', icon: '▤', targetSection: 'reports' },
    ],
  },
  {
    id: 'hods',
    title: 'HOD Management',
    description: 'Coordinate academic leads and departmental oversight.',
    badge: 'Academic',
    stats: [{ label: 'HODs', value: '04' }, { label: 'Open Requests', value: '02' }, { label: 'Status', value: 'Healthy' }, { label: 'Alerts', value: '01' }],
    body: <div><p>Assign and review HODs within this institution.</p></div>,
    actions: [
      { label: 'Add HOD', icon: '＋', targetSection: 'hods' },
      { label: 'Edit Roles', icon: '✎', targetSection: 'staff' },
      { label: 'Notify', icon: '✉', targetSection: 'reports' },
    ],
  },
  {
    id: 'staff',
    title: 'Staff Management',
    description: 'Manage faculty access and classroom operations.',
    badge: 'Faculty',
    stats: [{ label: 'Active', value: '24' }, { label: 'Pending', value: '03' }, { label: 'Today', value: '08' }, { label: 'Sessions', value: '16' }],
    body: <div><p>Staff users can be managed from one place here.</p></div>,
    actions: [
      { label: 'Invite Staff', icon: '✉', targetSection: 'staff' },
      { label: 'Reset Access', icon: '↺', targetSection: 'staff' },
      { label: 'View Timetable', icon: '▣', targetSection: 'departments' },
    ],
  },
  {
    id: 'departments',
    title: 'Departments',
    description: 'Track departments and academic structure.',
    badge: 'Structure',
    stats: [{ label: 'Departments', value: '06' }, { label: 'Programs', value: '14' }, { label: 'Staff', value: '24' }, { label: 'Students', value: '480' }],
    body: <div><p>Departments are the base organizational layer for attendance and scheduling.</p></div>,
    actions: [
      { label: 'Create Department', icon: '＋', targetSection: 'departments' },
      { label: 'Manage Faculty', icon: '◌', targetSection: 'staff' },
      { label: 'Open List', icon: '▣', targetSection: 'departments' },
    ],
  },
  {
    id: 'students',
    title: 'Students',
    description: 'Review student records and participation.',
    badge: 'Records',
    stats: [{ label: 'Present', value: '432' }, { label: 'Absent', value: '48' }, { label: 'Flagged', value: '07' }, { label: 'Pending', value: '12' }],
    body: <div><p>This area can be expanded for student onboarding and record monitoring.</p></div>,
    actions: [
      { label: 'Invite Student', icon: '✉', targetSection: 'students' },
      { label: 'View Profile', icon: '◭', targetSection: 'students' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Monitor attendance trends and session outcomes.',
    badge: 'Operations',
    stats: [{ label: 'Sessions', value: '34' }, { label: 'Safe', value: '99%' }, { label: 'Flagged', value: '06' }, { label: 'Active', value: '02' }],
    body: <div><p>Track the current attendance operation and review recent activity.</p></div>,
    actions: [
      { label: 'Open Register', icon: '▤', targetSection: 'attendance' },
      { label: 'Review Session', icon: '◫', targetSection: 'attendance' },
      { label: 'Notify', icon: '✉', targetSection: 'reports' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Access institution-level summaries and trends.',
    badge: 'Insights',
    stats: [{ label: 'Today', value: '08' }, { label: 'This Week', value: '42' }, { label: 'High Risk', value: '03' }, { label: 'Status', value: 'Good' }],
    body: <div><p>Reports can be expanded to include attendance heatmaps and participation analytics.</p></div>,
    actions: [
      { label: 'Open Report', icon: '◬', targetSection: 'reports' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
      { label: 'Share', icon: '✉', targetSection: 'reports' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Adjust institutional preferences.',
    badge: 'Config',
    stats: [{ label: 'Theme', value: 'Mono' }, { label: 'Policies', value: 'Active' }, { label: 'Notifications', value: 'On' }, { label: 'Version', value: 'v1.0' }],
    body: <div><p>Configuration tools can be extended later with roles, branding, and policy controls.</p></div>,
    actions: [
      { label: 'Edit Config', icon: '⚙', targetSection: 'settings' },
      { label: 'Save', icon: '✓', targetSection: 'settings' },
      { label: 'Review', icon: '▤', targetSection: 'settings' },
    ],
  },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout
      title="Institution Admin"
      subtitle="Administration Console"
      userName="Admin"
      userRole="Institution Administrator"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
    />
  );
}
