import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatWhen } from '../utils/interview'

const PAGE_SIZE = 15

export default function Notifications() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/notifications', { params: { page, size: PAGE_SIZE } })
      .then((res) => {
        setData(res.data)
        setError('')
      })
      .catch(() => setError('Could not load your notifications'))
      .finally(() => setLoading(false))
  }, [page, reload])

  const open = async (n) => {
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n.id}/read`)
      } catch {
        // opening the page still works if marking fails
      }
    }
    if (n.link) navigate(n.link)
    else setReload((v) => v + 1)
  }

  const readAll = async () => {
    setError('')
    try {
      await api.patch('/notifications/read-all')
      setReload((v) => v + 1)
    } catch {
      setError('Could not mark them as read')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  const hasUnread = data?.content.some((n) => !n.read)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">Notifications</h1>
        {hasUnread && (
          <button onClick={readAll} className="text-sm text-indigo-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {data && data.content.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">You have no notifications yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {data?.content.map((n) => (
          <button
            key={n.id}
            onClick={() => open(n)}
            className={`block w-full rounded-xl p-4 text-left shadow hover:shadow-md ${
              n.read ? 'bg-white' : 'bg-indigo-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className={`font-medium ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                {!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-600" />}
                {n.title}
              </p>
              <span className="whitespace-nowrap text-xs text-slate-500">{formatWhen(n.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{n.message}</p>
          </button>
        ))}
      </div>

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