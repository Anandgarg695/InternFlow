import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authActions'
import { dashboardPath } from '../utils/roles'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const roleNavLinks = () => {
    if (!user) return null
    if (user.role === 'STUDENT') {
      return [
        { to: '/student/dashboard', label: 'Dashboard' },
        { to: '/student/internships', label: 'Internships' },
        { to: '/student/applications', label: 'Applications' },
        { to: '/student/interviews', label: 'Interviews' },
        { to: '/student/offers', label: 'Offers' },
        { to: '/student/placements', label: 'Placement' },
      ]
    }
    if (user.role === 'COMPANY') {
      return [
        { to: '/company/dashboard', label: 'Dashboard' },
        { to: '/company/internships', label: 'Internships' },
        { to: '/company/analytics', label: 'Analytics' },
        { to: '/company/mentors', label: 'Mentors' },
      ]
    }
    if (user.role === 'MENTOR') {
      return [
        { to: '/mentor/dashboard', label: 'Dashboard' },
        { to: '/mentor/interns', label: 'Interns' },
      ]
    }
    if (user.role === 'ADMIN') {
      return [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/users', label: 'Users' },
      ]
    }
    return []
  }

  const navLinks = roleNavLinks()

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo & Main Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-sm">
                  IF
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    InternFlow
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 -mt-1">
                    Placement Platform
                  </span>
                </div>
              </Link>

              {/* In-app Role Navigation Links */}
              {user && navLinks && navLinks.length > 0 && (
                <nav className="hidden md:flex items-center gap-1">
                  {navLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>

            {/* Right Side Actions & Profile */}
            <div className="flex items-center gap-3 text-sm">
              <Link
                to="/verify"
                className="hidden sm:inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600 px-2 py-1 transition-colors"
              >
                Verify Credential
              </Link>

              {user ? (
                <>
                  <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />
                  <NotificationBell />

                  {/* User Profile Pill */}
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 py-1 pl-1 pr-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-medium text-slate-800 leading-tight truncate max-w-[120px]">
                        {user.fullName}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-none uppercase">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 shadow-2xs transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Links bar if logged in */}
        {user && navLinks && navLinks.length > 0 && (
          <div className="md:hidden border-t border-slate-200 overflow-x-auto px-4 py-2 flex items-center gap-1 scrollbar-none">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Grounded Enterprise Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">InternFlow</span>
            <span>·</span>
            <span>Enterprise Internship & Recruitment Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium text-[11px]">System Operational</span>
            </div>
            <span>·</span>
            <Link to="/verify" className="hover:text-slate-800 transition-colors">
              Verify Certificate
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
