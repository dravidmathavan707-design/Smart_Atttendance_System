import DashboardLayout from '../../components/DashboardLayout';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'staff', label: 'Staff', icon: '◌' },
  { id: 'students', label: 'Students', icon: '◭' },
  { id: 'timetable', label: 'Timetable', icon: '▣' },
  { id: 'attendance', label: 'Attendance', icon: '◫' },
  { id: 'reports', label: 'Reports', icon: '◬' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const sections = [
  {
    id: 'overview',
    title: 'Department Oversight',
    description: 'Coordinate staff, student progress, and department operations.',
    badge: 'Live',
    stats: [{ label: 'Staff', value: '08' }, { label: 'Students', value: '180' }, { label: 'Sessions', value: '12' }, { label: 'Attendance', value: '90%' }],
    body: <div><p>Your HOD dashboard is now structured for department-level management.</p></div>,
    actions: [
      { label: 'Review Staff', icon: '◌', targetSection: 'staff' },
      { label: 'View Students', icon: '◭', targetSection: 'students' },
      { label: 'Open Reports', icon: '▤', targetSection: 'reports' },
    ],
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Coordinate assigned faculty members.',
    badge: 'Faculty',
    stats: [{ label: 'Active', value: '08' }, { label: 'Pending', value: '02' }, { label: 'Today', value: '04' }, { label: 'Status', value: 'Healthy' }],
    body: <div><p>Use this panel to keep the department staff workflow organized.</p></div>,
    actions: [
      { label: 'Invite Staff', icon: '✉', targetSection: 'staff' },
      { label: 'Review Schedules', icon: '▣', targetSection: 'timetable' },
      { label: 'Notify', icon: '✉', targetSection: 'reports' },
    ],
  },
  {
    id: 'students',
    title: 'Students',
    description: 'Track student participation and department progress.',
    badge: 'Students',
    stats: [{ label: 'Present', value: '154' }, { label: 'Absent', value: '26' }, { label: 'Flagged', value: '03' }, { label: 'Pending', value: '04' }],
    body: <div><p>Student visibility is now centralized for the HOD.</p></div>,
    actions: [
      { label: 'Open Records', icon: '◭', targetSection: 'students' },
      { label: 'Message Class', icon: '✉', targetSection: 'overview' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Review lectures and subject allocations.',
    badge: 'Schedule',
    stats: [{ label: 'Sessions', value: '12' }, { label: 'Rooms', value: '06' }, { label: 'Faculty', value: '08' }, { label: 'Status', value: 'Active' }],
    body: <div><p>The timetable section is ready for the department calendar flow.</p></div>,
    actions: [
      { label: 'View Week', icon: '▣', targetSection: 'timetable' },
      { label: 'Edit', icon: '✎', targetSection: 'timetable' },
      { label: 'Share', icon: '✉', targetSection: 'reports' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Monitor attendance trends by class and subject.',
    badge: 'Monitoring',
    stats: [{ label: 'Today', value: '90%' }, { label: 'This Week', value: '87%' }, { label: 'Flagged', value: '03' }, { label: 'Pending', value: '02' }],
    body: <div><p>Attendance reporting is ready for HOD-level review.</p></div>,
    actions: [
      { label: 'Open Register', icon: '▤', targetSection: 'attendance' },
      { label: 'Review', icon: '◫', targetSection: 'attendance' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Inspect class and department performance.',
    badge: 'Insights',
    stats: [{ label: 'Ops', value: 'Good' }, { label: 'Issues', value: '02' }, { label: 'Growth', value: '+6%' }, { label: 'Trend', value: 'Up' }],
    body: <div><p>Reports can later connect to live analytics.</p></div>,
    actions: [
      { label: 'Generate', icon: '◬', targetSection: 'reports' },
      { label: 'Share', icon: '✉', targetSection: 'reports' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Manage department preferences.',
    badge: 'Config',
    stats: [{ label: 'Theme', value: 'Mono' }, { label: 'Alerts', value: 'On' }, { label: 'Policies', value: 'Active' }, { label: 'Version', value: 'v1.0' }],
    body: <div><p>Settings remain centralized and ready for further expansion.</p></div>,
    actions: [
      { label: 'Edit', icon: '⚙', targetSection: 'settings' },
      { label: 'Save', icon: '✓', targetSection: 'settings' },
      { label: 'Review', icon: '▤', targetSection: 'settings' },
    ],
  },
];

export default function HODDashboard() {
  return (
    <DashboardLayout
      title="Head of Department"
      subtitle="Department Command Center"
      userName="HOD"
      userRole="Academic Lead"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
    />
  );
}
