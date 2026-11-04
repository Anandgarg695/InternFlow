import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'
import { formatDateTime } from '../utils/application'

const ROLES = ['STUDENT', 'COMPANY', 'MENTOR', 'ADMIN']
const PAGE_SIZE = 15

export default function AdminUsers() {
  const me = useSelector((state) => state.auth.user)
  const [params, setParams] = useSearchParams()
  const pending = params.get('pending') === 'true'

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [filters, setFilters] = useState({ q: '', role: '' })
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const query = { page, size: PAGE_SIZE }
    if (filters.q) query.q = filters.q
    if (filters.role) query.role = filters.role
    if (pending) query.pending = true

    api.get('/admin/users', { params: query })
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load the users'))
      .finally(() => setLoading(false))
  }, [filters, page, pending, reload])

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setPage(0)
    setFilters({ q: search.trim(), role })
  }

  const togglePending = (checked) => {
    setLoading(true)
    setPage(0)
    setParams(checked ? { pending: 'true' } : {})
  }

  const act = async (path, body) => {
    setError('')
    try {
      await api.patch(path, body)
      setReload((n) => n + 1)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the change')
    }
  }

  return (
    <div>
      <Link to="/admin/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Users</h1>

      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Any role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
          Search
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pending} onChange={(e) => togglePending(e.target.checked)} />
          Only companies waiting for approval
        </label>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}

      {data && !loading && data.content.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No users found.</p>
      )}

      {data && data.content.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    {!u.enabled && (
                      <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Disabled</span>
                    )}
                    {u.role === 'COMPANY' && !u.approved && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Awaiting approval
                      </span>
                    )}
                    {u.enabled && (u.role !== 'COMPANY' || u.approved) && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(u.createdAt)}</td>
                  <td className="space-x-2 px-4 py-3">
                    {u.role === 'COMPANY' && !u.approved && (
                      <button
                        onClick={() => act(`/admin/users/${u.id}/approval`, { approved: true })}
                        className="rounded-md bg-green-600 px-2 py-1 text-white hover:bg-green-500"
                      >
                        Approve
                      </button>
                    )}
                    {u.role === 'COMPANY' && u.approved && (
                      <button
                        onClick={() => act(`/admin/users/${u.id}/approval`, { approved: false })}
                        className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-50"
                      >
                        Revoke approval
                      </button>
                    )}
                    {u.id !== me.id &&
                      (u.enabled ? (
                        <button
                          onClick={() => act(`/admin/users/${u.id}/enabled`, { enabled: false })}
                          className="rounded-md border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => act(`/admin/users/${u.id}/enabled`, { enabled: true })}
                          className="rounded-md bg-slate-800 px-2 py-1 text-white hover:bg-slate-700"
                        >
                          Enable
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => {
              setLoading(true)
              setPage(page - 1)
            }}
            disabled={page === 0}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-600">Page {data.page + 1} of {data.totalPages}</span>
          <button
            onClick={() => {
              setLoading(true)
              setPage(page + 1)
            }}
            disabled={page + 1 >= data.totalPages}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}