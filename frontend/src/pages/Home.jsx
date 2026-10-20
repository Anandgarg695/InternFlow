import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/Api'
import { dashboardPath } from '../utils/roles'

export default function Home() {
  const user = useSelector((state) => state.auth.user)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="rounded-xl bg-white p-8 text-center shadow">
      <h1 className="text-3xl font-bold text-indigo-600">InternFlow</h1>
      <p className="mt-2 text-slate-600">
        The complete internship journey, from discovery to certificate.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {user ? (
          <Link
            to={dashboardPath(user.role)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
          >
            Go to your dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-md border border-indigo-600 px-4 py-2 text-indigo-600 hover:bg-indigo-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
            >
              Register
            </Link>
          </>
        )}
      </div>

      <p className="mt-6 text-sm">
        {error && <span className="text-red-600">Backend not reachable</span>}
        {!error && !health && <span className="text-slate-500">Checking backend...</span>}
        {health && (
          <span className="text-green-600">
            Backend: {health.status} | Database: {health.database}
          </span>
        )}
      </p>
    </div>
  )
}