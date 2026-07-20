import DashboardLayout from '../../components/DashboardLayout';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'attendance', label: 'Mark Attendance', icon: '◫' },
  { id: 'history', label: 'Attendance History', icon: '▣' },
  { id: 'timetable', label: 'Timetable', icon: '◭' },
  { id: 'profile', label: 'Profile', icon: '◌' },
  { id: 'notifications', label: 'Notifications', icon: '✉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const sections = [
  {
    id: 'overview',
    title: 'Student Portal',
    description: 'Track your attendance and academic updates.',
    badge: 'Live',
    stats: [{ label: 'Present', value: '84%' }, { label: 'Absent', value: '16%' }, { label: 'Sessions', value: '12' }, { label: 'Status', value: 'Healthy' }],
    body: <div><p>Your student dashboard is now structured with attendance and profile modules.</p></div>,
    actions: [
      { label: 'Mark Attendance', icon: '◫', targetSection: 'attendance' },
      { label: 'View Timetable', icon: '▣', targetSection: 'timetable' },
      { label: 'Open Profile', icon: '◌', targetSection: 'profile' },
    ],
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    description: 'Check in for today’s session.',
    badge: 'Today',
    stats: [{ label: 'Subject', value: 'Maths' }, { label: 'Room', value: 'A-12' }, { label: 'Time', value: '09:00' }, { label: 'Status', value: 'Ready' }],
    body: <div><p>This section can be connected to the attendance check-in flow later.</p></div>,
    actions: [
      { label: 'Check In', icon: '✓', targetSection: 'attendance' },
      { label: 'View Session', icon: '◫', targetSection: 'attendance' },
      { label: 'Help', icon: '?', targetSection: 'notifications' },
    ],
  },
  {
    id: 'history',
    title: 'Attendance History',
    description: 'Track your recent attendance record.',
    badge: 'History',
    stats: [{ label: 'This Week', value: '05' }, { label: 'This Month', value: '18' }, { label: 'Missed', value: '02' }, { label: 'Trend', value: 'Up' }],
    body: <div><p>Your attendance history can be shown here once the data layer is connected.</p></div>,
    actions: [
      { label: 'View History', icon: '▣', targetSection: 'history' },
      { label: 'Export', icon: '⇩', targetSection: 'history' },
      { label: 'Share', icon: '✉', targetSection: 'notifications' },
    ],
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'See your lectures and session list.',
    badge: 'Schedule',
    stats: [{ label: 'Today', value: '04' }, { label: 'Tomorrow', value: '03' }, { label: 'Rooms', value: '06' }, { label: 'Status', value: 'Live' }],
    body: <div><p>The student timetable panel is ready for academic schedules.</p></div>,
    actions: [
      { label: 'Open Timetable', icon: '▣', targetSection: 'timetable' },
      { label: 'View Class', icon: '◭', targetSection: 'attendance' },
      { label: 'Remind', icon: '✉', targetSection: 'notifications' },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Manage your student profile details.',
    badge: 'Profile',
    stats: [{ label: 'Name', value: 'Student' }, { label: 'Dept', value: 'CSE' }, { label: 'ID', value: 'S-102' }, { label: 'Status', value: 'Active' }],
    body: <div><p>Student profile information can be expanded here later.</p></div>,
    actions: [
      { label: 'Edit Profile', icon: '✎', targetSection: 'profile' },
      { label: 'Upload Photo', icon: '⬆', targetSection: 'profile' },
      { label: 'Save', icon: '✓', targetSection: 'profile' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay updated with campus announcements.',
    badge: 'Updates',
    stats: [{ label: 'Unread', value: '03' }, { label: 'Today', value: '01' }, { label: 'Urgent', value: '01' }, { label: 'Status', value: 'New' }],
    body: <div><p>Notifications can be wired to upcoming sessions and attendance alerts.</p></div>,
    actions: [
      { label: 'View Alerts', icon: '✉', targetSection: 'notifications' },
      { label: 'Mark Read', icon: '✓', targetSection: 'notifications' },
      { label: 'Archive', icon: '▥', targetSection: 'notifications' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Adjust your personal preferences.',
    badge: 'Config',
    stats: [{ label: 'Theme', value: 'Mono' }, { label: 'Alerts', value: 'On' }, { label: 'Privacy', value: 'Standard' }, { label: 'Version', value: 'v1.0' }],
    body: <div><p>Student settings can later include device preferences and notification controls.</p></div>,
    actions: [
      { label: 'Edit Settings', icon: '⚙', targetSection: 'settings' },
      { label: 'Save', icon: '✓', targetSection: 'settings' },
      { label: 'Review', icon: '▤', targetSection: 'settings' },
    ],
  },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout
      title="Student"
      subtitle="Student Portal"
      userName="Student"
      userRole="Learner"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
    />
  );
}
