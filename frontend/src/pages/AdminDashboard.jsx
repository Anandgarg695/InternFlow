import DashboardShell from '../components/DashboardShell'

export default function AdminDashboard() {
  return (
    <DashboardShell
      title="Admin dashboard"
      description="Coming soon: approve companies and mentors, manage users and view analytics."
      pingPath="/admin/ping"
    />
  )
}