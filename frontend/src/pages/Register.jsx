import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/authActions'
import { dashboardPath } from '../utils/roles'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.auth.user)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (currentUser) return <Navigate to={dashboardPath(currentUser.role)} replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const user = await dispatch(register(form))
      navigate(dashboardPath(user.role), { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not reach the server')
      setFieldErrors(data?.fields || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-indigo-600">Create your account</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required value={form.fullName} onChange={onChange} className={inputClass} />
          {fieldErrors.fullName && <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required value={form.email} onChange={onChange} className={inputClass} />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password (at least 8 characters)</label>
          <input id="password" name="password" type="password" required minLength={8} value={form.password} onChange={onChange} className={inputClass} />
          {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="role">I am a</label>
          <select id="role" name="role" value={form.role} onChange={onChange} className={inputClass}>
            <option value="STUDENT">Student</option>
            <option value="COMPANY">Company</option>
            <option value="MENTOR">Mentor</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
      </p>
    </div>
  )
}