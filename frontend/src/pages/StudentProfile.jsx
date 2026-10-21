import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const EMPTY = {
  phone: '',
  university: '',
  degree: '',
  branch: '',
  graduationYear: '',
  cgpa: '',
  skills: '',
  bio: '',
  linkedinUrl: '',
  githubUrl: '',
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

const toForm = (data) =>
  Object.fromEntries(Object.keys(EMPTY).map((key) => [key, data[key] ?? '']))

const blankToNull = (value) => (String(value).trim() === '' ? null : String(value).trim())

const toPayload = (form) => ({
  phone: blankToNull(form.phone),
  university: blankToNull(form.university),
  degree: blankToNull(form.degree),
  branch: blankToNull(form.branch),
  graduationYear: form.graduationYear === '' ? null : Number(form.graduationYear),
  cgpa: form.cgpa === '' ? null : Number(form.cgpa),
  skills: blankToNull(form.skills),
  bio: blankToNull(form.bio),
  linkedinUrl: blankToNull(form.linkedinUrl),
  githubUrl: blankToNull(form.githubUrl),
})

const FIELDS = [
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'university', label: 'University / College', type: 'text' },
  { name: 'degree', label: 'Degree (for example B.E., B.Tech)', type: 'text' },
  { name: 'branch', label: 'Branch / Major', type: 'text' },
  { name: 'graduationYear', label: 'Graduation year', type: 'number' },
  { name: 'cgpa', label: 'CGPA (0 to 10)', type: 'number', step: '0.01' },
  { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text', placeholder: 'https://www.linkedin.com/in/...' },
  { name: 'githubUrl', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' },
]

export default function StudentProfile() {
  const [form, setForm] = useState(EMPTY)
  const [info, setInfo] = useState({ fullName: '', email: '', complete: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/student/profile')
      .then((res) => {
        setForm(toForm(res.data))
        setInfo({ fullName: res.data.fullName, email: res.data.email, complete: res.data.complete })
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
      const res = await api.put('/student/profile', toPayload(form))
      setForm(toForm(res.data))
      setInfo({ fullName: res.data.fullName, email: res.data.email, complete: res.data.complete })
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
          <h1 className="text-2xl font-bold text-indigo-600">My profile</h1>
          <p className="mt-1 text-sm text-slate-600">{info.fullName} · {info.email}</p>
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
                step={f.step}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={onChange}
                className={inputClass}
              />
              {fieldErrors[f.name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[f.name]}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="skills">Skills (separate with commas)</label>
          <textarea
            id="skills"
            name="skills"
            rows={2}
            value={form.skills}
            onChange={onChange}
            placeholder="Java, React, SQL"
            className={inputClass}
          />
          {fieldErrors.skills && <p className="mt-1 text-sm text-red-600">{fieldErrors.skills}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="bio">About you</label>
          <textarea id="bio" name="bio" rows={4} value={form.bio} onChange={onChange} className={inputClass} />
          {fieldErrors.bio && <p className="mt-1 text-sm text-red-600">{fieldErrors.bio}</p>}
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
          <Link to="/student/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  )
}