import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/authActions'
import { dashboardPath } from '../utils/roles'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.auth.user)
  const [form, setForm] = useState({ email: '', password: '' })
  const [selectedRole, setSelectedRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (currentUser) return <Navigate to={dashboardPath(currentUser.role)} replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const fillRole = (roleKey, email, password) => {
    setSelectedRole(roleKey)
    setForm({ email, password })
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await dispatch(login(form.email, form.password))
      navigate(dashboardPath(user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection failure.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Side: Brand & Product Showcase (Solid Slate) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-slate-900 p-10 text-white">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 font-bold text-sm text-white">
                IF
              </div>
              <span className="text-lg font-bold tracking-tight text-white">InternFlow</span>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                The complete lifecycle for university internships.
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Connect candidates, hiring teams, and academic mentors with screening rounds, integrated video calling, and digital credentialing.
              </p>
            </div>

            <div className="mt-8 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  1
                </span>
                <span>Role-based screening: MCQ and Theory evaluations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  2
                </span>
                <span>In-browser WebRTC interviews with zero plugins</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-[10px]">
                  3
                </span>
                <span>Automated placement verification & certificates</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Enterprise Security Standard</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Verified Architecture
            </span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 flex flex-col justify-center p-8 sm:p-12">
          <div className="w-full max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your registered email and password to proceed.
              </p>
            </div>

            {/* Clean Segmented Control for Demo Roles */}
            <div className="mt-6 rounded-lg bg-slate-100 p-1 border border-slate-200">
              <div className="grid grid-cols-4 gap-1 text-center">
                <button
                  type="button"
                  onClick={() => fillRole('student', 'student@internflow.local', 'password123')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    selectedRole === 'student'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('company', 'company@internflow.local', 'password123')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    selectedRole === 'company'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('mentor', 'mentor@internflow.local', 'password123')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    selectedRole === 'mentor'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mentor
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('admin', 'admin@internflow.local', 'INEEDAJOBPLEASE')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
