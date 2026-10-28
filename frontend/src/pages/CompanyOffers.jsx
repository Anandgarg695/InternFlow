import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatDate, formatStipend } from '../utils/internship'
import { OFFER_STATUS, dateInput } from '../utils/offer'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

export default function CompanyOffers() {
  const { id } = useParams()
  const [internship, setInternship] = useState(null)
  const [shortlisted, setShortlisted] = useState([])
  const [offers, setOffers] = useState([])
  const [form, setForm] = useState({
    applicationId: '',
    stipendPerMonth: '',
    startDate: dateInput(30),
    expiresOn: dateInput(7),
    message: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const load = () =>
    Promise.all([
      api.get(`/company/internships/${id}`),
      api.get(`/company/internships/${id}/applications`),
      api.get(`/company/internships/${id}/offers`),
    ])
      .then(([internshipRes, applicants, offerList]) => {
        setInternship(internshipRes.data)
        setShortlisted(applicants.data.filter((a) => a.status === 'SHORTLISTED'))
        setOffers(offerList.data)
        setForm((f) => ({
          ...f,
          stipendPerMonth: f.stipendPerMonth === '' ? String(internshipRes.data.stipendPerMonth) : f.stipendPerMonth,
        }))
      })
      .catch(() => setError('Could not load the offers'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      await api.post(`/company/applications/${form.applicationId}/offers`, {
        stipendPerMonth: form.stipendPerMonth === '' ? null : Number(form.stipendPerMonth),
        startDate: form.startDate === '' ? null : form.startDate,
        expiresOn: form.expiresOn === '' ? null : form.expiresOn,
        message: form.message.trim() === '' ? null : form.message.trim(),
      })
      setForm((f) => ({ ...f, applicationId: '', message: '' }))
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not make the offer')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  const withdraw = async (offerId) => {
    if (!window.confirm('Withdraw this offer? The applicant goes back to the shortlist.')) return
    setError('')
    try {
      await api.patch(`/company/offers/${offerId}/withdraw`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not withdraw the offer')
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  const accepted = offers.filter((o) => o.status === 'ACCEPTED').length
  const pending = offers.filter((o) => o.status === 'OFFERED').length
  const openings = internship?.openings ?? 0
  const full = accepted + pending >= openings

  const fieldError = (name) =>
    fieldErrors[name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[name]}</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
        ← Back to my internships
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Offers</h1>
      {internship && <p className="text-slate-600">{internship.title}</p>}

      <p className="mt-3 rounded-md bg-white p-3 text-sm shadow">
        Openings: <strong>{openings}</strong> · Accepted: <strong>{accepted}</strong> · Pending offers:{' '}
        <strong>{pending}</strong>
        {internship?.status === 'CLOSED' && ' · This internship is closed to new applications.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
        <h2 className="font-semibold">Make an offer</h2>

        {full && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            All openings already have an offer. Withdraw a pending offer to make another one.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium" htmlFor="applicationId">Applicant</label>
          <select
            id="applicationId"
            name="applicationId"
            required
            value={form.applicationId}
            onChange={onChange}
            className={inputClass}
          >
            <option value="">Select a shortlisted applicant</option>
            {shortlisted.map((a) => (
              <option key={a.id} value={a.id}>
                {a.studentName} (round {a.currentRound})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Applicants with an active interview are refused: complete or cancel it first.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium" htmlFor="stipendPerMonth">Stipend (₹ / month)</label>
            <input
              id="stipendPerMonth"
              name="stipendPerMonth"
              type="number"
              min="0"
              required
              value={form.stipendPerMonth}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('stipendPerMonth')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="expiresOn">Respond by</label>
            <input
              id="expiresOn"
              name="expiresOn"
              type="date"
              required
              min={dateInput(0)}
              value={form.expiresOn}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('expiresOn')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              min={dateInput(1)}
              value={form.startDate}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('startDate')}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="message">Message to the student (optional)</label>
          <textarea id="message" name="message" rows={3} value={form.message} onChange={onChange} className={inputClass} />
          {fieldError('message')}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Sending...' : 'Send offer'}
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Offers made</h2>
      {offers.length === 0 && (
        <p className="mt-3 rounded-xl bg-white p-6 text-slate-600 shadow">No offers yet.</p>
      )}

      <div className="mt-3 space-y-4">
        {offers.map((o) => {
          const status = OFFER_STATUS[o.status]
          return (
            <div key={o.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{o.studentName}</p>
                  <p className="text-sm text-slate-600">{o.studentEmail}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatStipend(o.stipendPerMonth)} · starts {formatDate(o.startDate)} · respond by{' '}
                    {formatDate(o.expiresOn)}
                  </p>
                  {o.message && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{o.message}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
              </div>
              {o.status === 'OFFERED' && (
                <button
                  onClick={() => withdraw(o.id)}
                  className="mt-4 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Withdraw offer
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}