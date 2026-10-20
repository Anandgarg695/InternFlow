import DashboardShell from '../components/DashboardShell'

export default function StudentDashboard() {
  return (
    <DashboardShell
      title="Student dashboard"
      description="Coming soon: browse internships, apply, take tests and track your applications."
      pingPath="/student/ping"
    />
  )
}