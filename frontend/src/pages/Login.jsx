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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (currentUser) return <Navigate to={dashboardPath(currentUser.role)} replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await dispatch(login(form.email, form.password))
      navigate(dashboardPath(user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-indigo-600">Login</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={onChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        No account yet? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link>
      </p>
    </div>
  )
}