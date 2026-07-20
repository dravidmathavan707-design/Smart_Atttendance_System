import DashboardLayout from '../../components/DashboardLayout';
import '../../components/DashboardLayout.css';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'timetable', label: 'Timetable', icon: '▣' },
  { id: 'current', label: 'Current Session', icon: '▤' },
  { id: 'attendance', label: 'Attendance', icon: '◫' },
  { id: 'reports', label: 'Reports', icon: '◬' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const sections = [
  {
    id: 'overview',
    title: 'Faculty Portal',
    description: 'Manage class sessions, attendance, and reporting.',
    badge: 'Live',
    stats: [
      { label: 'Classes Today', value: '03' },
      { label: 'Students', value: '120' },
      { label: 'Active Sessions', value: '01' },
      { label: 'Attendance', value: '92%' },
    ],
    body: (
      <div>
        <p>This faculty dashboard is streamlined for classroom attendance and session oversight.</p>
        <p>Use the sidebar and section actions to navigate between your most important tasks.</p>
      </div>
    ),
    actions: [
      { label: 'View Timetable', icon: '▣', targetSection: 'timetable' },
      { label: 'Current Session', icon: '▤', targetSection: 'current' },
      { label: 'Attendance Report', icon: '◬', targetSection: 'attendance' },
    ],
  },
  {
    id: 'timetable',
    title: 'Lecture Timetable',
    description: 'Review assigned sessions and room allocation.',
    badge: 'Schedule',
    stats: [
      { label: 'Today', value: '03' },
      { label: 'Tomorrow', value: '02' },
      { label: 'Rooms', value: '05' },
      { label: 'Status', value: 'On Track' },
    ],
    body: (
      <div>
        <p>All scheduled lectures for the current academic day are shown here.</p>
        <p>Use the session actions to start, review or share classroom details.</p>
      </div>
    ),
    actions: [
      { label: 'Open Schedule', icon: '▣', targetSection: 'timetable' },
      { label: 'Start Next Session', icon: '▶', targetSection: 'current' },
      { label: 'View Students', icon: '◭', targetSection: 'attendance' },
    ],
  },
  {
    id: 'current',
    title: 'Current Session',
    description: 'Monitor the active classroom attendance session.',
    badge: 'Active',
    stats: [
      { label: 'Present', value: '28' },
      { label: 'Absent', value: '02' },
      { label: 'Duration', value: '45m' },
      { label: 'Room', value: 'Lab 3' },
    ],
    body: (
      <div>
        <p>The current lecture is being tracked in real time. You can close the session, review attendance, or return to the timetable.</p>
      </div>
    ),
    actions: [
      { label: 'Close Session', icon: '✕', targetSection: 'current' },
      { label: 'Mark Attendance', icon: '✓', targetSection: 'attendance' },
      { label: 'View Report', icon: '◬', targetSection: 'reports' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Review attendance status for your classes.',
    badge: 'Monitoring',
    stats: [
      { label: 'This Week', value: '89%' },
      { label: 'Today', value: '92%' },
      { label: 'Late', value: '03' },
      { label: 'Flagged', value: '01' },
    ],
    body: (
      <div>
        <p>Attendance data is ready for department review and follow-up actions.</p>
      </div>
    ),
    actions: [
      { label: 'Open Register', icon: '▤', targetSection: 'attendance' },
      { label: 'Review Trend', icon: '◬', targetSection: 'reports' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Inspect attendance and session performance.',
    badge: 'Insights',
    stats: [
      { label: 'Reports', value: '07' },
      { label: 'Open Issues', value: '02' },
      { label: 'Completed', value: '05' },
      { label: 'Status', value: 'Good' },
    ],
    body: (
      <div>
        <p>View generated academic reports for sessions, attendance, and student engagement.</p>
      </div>
    ),
    actions: [
      { label: 'Open Report', icon: '◬', targetSection: 'reports' },
      { label: 'Share', icon: '✉', targetSection: 'reports' },
      { label: 'Export', icon: '⇩', targetSection: 'reports' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Manage your account and notification preferences.',
    badge: 'Config',
    stats: [
      { label: 'Theme', value: 'Mono' },
      { label: 'Alerts', value: 'On' },
      { label: 'Privacy', value: 'Standard' },
      { label: 'Version', value: 'v1.0' },
    ],
    body: (
      <div>
        <p>Faculty settings are ready for future preferences such as notifications, schedule reminders, and user profile edits.</p>
      </div>
    ),
    actions: [
      { label: 'Edit Settings', icon: '⚙', targetSection: 'settings' },
      { label: 'Save', icon: '✓', targetSection: 'settings' },
      { label: 'Review', icon: '▤', targetSection: 'settings' },
    ],
  },
];

export default function StaffDashboard() {
  return (
    <DashboardLayout
      title="Faculty"
      subtitle="Classroom Attendance"
      userName="Faculty"
      userRole="Teaching Staff"
      menuItems={menuItems}
      sections={sections}
      defaultSection="overview"
    />
  );
}
