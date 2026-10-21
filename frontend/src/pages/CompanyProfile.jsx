import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const EMPTY = {
  companyName: '',
  industry: '',
  companySize: '',
  website: '',
  location: '',
  contactPhone: '',
  linkedinUrl: '',
  description: '',
}

const SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+']

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

const toForm = (data) =>
  Object.fromEntries(Object.keys(EMPTY).map((key) => [key, data[key] ?? '']))

const blankToNull = (value) => (String(value).trim() === '' ? null : String(value).trim())

const toPayload = (form) =>
  Object.fromEntries(Object.keys(EMPTY).map((key) => [key, blankToNull(form[key])]))

const FIELDS = [
  { name: 'companyName', label: 'Company name', type: 'text' },
  { name: 'industry', label: 'Industry (for example Software, Finance)', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'contactPhone', label: 'Contact phone', type: 'text' },
  { name: 'website', label: 'Website', type: 'text', placeholder: 'https://example.com' },
  { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text', placeholder: 'https://www.linkedin.com/company/...' },
]

export default function CompanyProfile() {
  const [form, setForm] = useState(EMPTY)
  const [info, setInfo] = useState({ contactName: '', email: '', complete: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/company/profile')
      .then((res) => {
        setForm(toForm(res.data))
        setInfo({ contactName: res.data.contactName, email: res.data.email, complete: res.data.complete })
      })
      .catch(() => setError('Could not load your profile'))
      .finally(() => setLoading(false))
  }, [])

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaved(false)
    setSaving(true)
    try {
      const res = await api.put('/company/profile', toPayload(form))
      setForm(toForm(res.data))
      setInfo({ contactName: res.data.contactName, email: res.data.email, complete: res.data.complete })
      setSaved(true)
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save your profile')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading your profile...</p>

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Company profile</h1>
          <p className="mt-1 text-sm text-slate-600">Account: {info.contactName} · {info.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            info.complete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {info.complete ? 'Profile complete' : 'Profile incomplete'}
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium" htmlFor={f.name}>{f.label}</label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={onChange}
                className={inputClass}
              />
              {fieldErrors[f.name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[f.name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium" htmlFor="companySize">Company size (employees)</label>
            <select id="companySize" name="companySize" value={form.companySize} onChange={onChange} className={inputClass}>
              <option value="">Select size</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldErrors.companySize && <p className="mt-1 text-sm text-red-600">{fieldErrors.companySize}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="description">About the company</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={onChange}
            className={inputClass}
          />
          {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Profile saved.</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          <Link to="/company/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  )
}