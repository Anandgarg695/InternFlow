import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authActions'
import { dashboardPath } from '../utils/roles'

export default function Layout() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white shadow-sm">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-indigo-600">InternFlow</Link>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link to={dashboardPath(user.role)} className="hover:text-indigo-600">Dashboard</Link>
                <span className="text-slate-500">{user.fullName} ({user.role})</span>
                <button
                  onClick={onLogout}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-indigo-600">Login</Link>
                <Link
                  to="/register"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}