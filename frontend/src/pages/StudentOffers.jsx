import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDate, formatStipend } from '../utils/internship'
import { OFFER_STATUS } from '../utils/offer'

export default function StudentOffers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    api.get('/student/offers')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your offers'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const respond = async (id, action) => {
    const question =
      action === 'accept'
        ? 'Accept this offer? You cannot undo this.'
        : 'Decline this offer? This ends your application for this internship.'
    if (!window.confirm(question)) return
    setError('')
    setBusy(true)
    try {
      await api.patch(`/student/offers/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your answer')
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading your offers...</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">My offers</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">
          You have no offers yet. Companies make offers after the rounds and interviews.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {items.map((o) => {
          const status = OFFER_STATUS[o.status]
          return (
            <div key={o.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{o.internshipTitle}</p>
                  <p className="text-sm text-indigo-600">{o.companyName || 'Company'}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatStipend(o.stipendPerMonth)} · {o.durationWeeks} weeks · starts {formatDate(o.startDate)}
                  </p>
                  {o.status === 'OFFERED' && (
                    <p className="text-sm text-slate-600">Respond by {formatDate(o.expiresOn)}</p>
                  )}
                  {o.message && <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{o.message}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
              </div>

              {o.status === 'OFFERED' && (
                <div className="mt-4 flex gap-2 text-sm">
                  <button
                    onClick={() => respond(o.id, 'accept')}
                    disabled={busy}
                    className="rounded-md bg-green-600 px-4 py-1.5 text-white hover:bg-green-500 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(o.id, 'decline')}
                    disabled={busy}
                    className="rounded-md border border-red-300 px-4 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              )}

              {o.status === 'ACCEPTED' && (
                <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
                  Congratulations! You are selected. Your internship starts on {formatDate(o.startDate)}.
                </p>
              )}
              {o.status === 'EXPIRED' && (
                <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  This offer expired because it was not answered in time. The company may contact you again.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}