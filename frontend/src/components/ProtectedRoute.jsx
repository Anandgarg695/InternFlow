import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { dashboardPath } from '../utils/roles'

export default function ProtectedRoute({ role }) {
  const user = useSelector((state) => state.auth.user)

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />
  return <Outlet />
}