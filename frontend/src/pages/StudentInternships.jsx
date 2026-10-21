import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { WORK_MODES, formatDate, formatStipend } from '../utils/internship'

const PAGE_SIZE = 9

export default function StudentInternships() {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('')
  const [filters, setFilters] = useState({ q: '', workMode: '' })
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = { page, size: PAGE_SIZE }
    if (filters.q) params.q = filters.q
    if (filters.workMode) params.workMode = filters.workMode

    api.get('/internships', { params })
      .then((res) => {
        setData(res.data)
        setError('')
      })
      .catch(() => setError('Could not load internships'))
      .finally(() => setLoading(false))
  }, [filters, page])

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setPage(0)
    setFilters({ q: search.trim(), workMode: mode })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-600">Find an internship</h1>

      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, skill or location"
          className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Any work mode</option>
          {Object.entries(WORK_MODES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
          Search
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}

      {data && !loading && data.content.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No internships found.</p>
      )}

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.content.map((item) => (
            <Link
              key={item.id}
              to={`/student/internships/${item.id}`}
              className="block rounded-xl bg-white p-5 shadow hover:shadow-md"
            >
              <h2 className="font-semibold text-slate-800">{item.title}</h2>
              <p className="mt-1 text-sm text-indigo-600">{item.companyName || 'Company'}</p>
              <p className="mt-2 text-sm text-slate-600">
                {WORK_MODES[item.workMode]}
                {item.location ? ` · ${item.location}` : ''}
              </p>
              <p className="text-sm text-slate-600">
                {item.durationWeeks} weeks · {formatStipend(item.stipendPerMonth)}
              </p>
              <p className="mt-2 text-xs text-slate-500">Apply by {formatDate(item.applicationDeadline)}</p>
            </Link>
          ))}
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