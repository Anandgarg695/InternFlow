import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { LINK_STATUS } from '../utils/placement'

export default function CompanyMentors() {
  const [links, setLinks] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () =>
    api.get('/company/mentors')
      .then((res) => setLinks(res.data))
      .catch(() => setError('Could not load your mentors'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const invite = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api.post('/company/mentors/invite', { email: email.trim() })
      setEmail('')
      setMessage('Invitation sent. The mentor must accept it before you can assign interns.')
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.fields?.email || data?.error || 'Could not send the invitation')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this mentor from your team?')) return
    setError('')
    setMessage('')
    try {
      await api.delete(`/company/mentors/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove the mentor')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/company/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Mentor team</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invite mentors by the email they used to register as a mentor. They must accept before you can assign
        interns to them.
      </p>

      <form onSubmit={invite} className="mt-6 flex flex-wrap gap-3 rounded-xl bg-white p-6 shadow">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mentor@example.com"
          className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Sending...' : 'Send invitation'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

      {links.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-600 shadow">No mentors yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {links.map((l) => {
          const status = LINK_STATUS[l.status]
          return (
            <div key={l.linkId} className="flex items-center justify-between gap-4 rounded-xl bg-white p-5 shadow">
              <div>
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-slate-600">{l.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
                <button
                  onClick={() => remove(l.linkId)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}