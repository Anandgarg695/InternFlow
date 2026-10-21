import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { WORK_MODES } from '../utils/internship'

const EMPTY = {
  title: '',
  description: '',
  skillsRequired: '',
  location: '',
  workMode: 'REMOTE',
  durationWeeks: '',
  stipendPerMonth: '0',
  openings: '1',
  applicationDeadline: '',
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none'

const toForm = (data) =>
  Object.fromEntries(Object.keys(EMPTY).map((key) => [key, data[key] == null ? '' : String(data[key])]))

const numberOrNull = (value) => (value === '' ? null : Number(value))

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  skillsRequired: form.skillsRequired.trim(),
  location: form.location.trim() === '' ? null : form.location.trim(),
  workMode: form.workMode,
  durationWeeks: numberOrNull(form.durationWeeks),
  stipendPerMonth: numberOrNull(form.stipendPerMonth),
  openings: numberOrNull(form.openings),
  applicationDeadline: form.applicationDeadline === '' ? null : form.applicationDeadline,
})

export default function InternshipForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!isEdit) return
    api.get(`/company/internships/${id}`)
      .then((res) => setForm(toForm(res.data)))
      .catch(() => setError('Could not load this internship'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/company/internships/${id}`, toPayload(form))
      } else {
        await api.post('/company/internships', toPayload(form))
      }
      navigate('/company/internships')
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || 'Could not save the internship')
      setFieldErrors(data?.fields || {})
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>

  const fieldError = (name) =>
    fieldErrors[name] && <p className="mt-1 text-sm text-red-600">{fieldErrors[name]}</p>

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-indigo-600">
        {isEdit ? 'Edit internship' : 'New internship'}
      </h1>
      {!isEdit && (
        <p className="mt-1 text-sm text-slate-600">
          It is saved as a draft. Students see it only after you publish it.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="title">Title</label>
          <input id="title" name="title" required value={form.title} onChange={onChange} className={inputClass} />
          {fieldError('title')}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            value={form.description}
            onChange={onChange}
            className={inputClass}
          />
          {fieldError('description')}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="skillsRequired">
            Skills required (separate with commas)
          </label>
          <input
            id="skillsRequired"
            name="skillsRequired"
            required
            value={form.skillsRequired}
            onChange={onChange}
            placeholder="Java, Spring Boot, SQL"
            className={inputClass}
          />
          {fieldError('skillsRequired')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="workMode">Work mode</label>
            <select id="workMode" name="workMode" value={form.workMode} onChange={onChange} className={inputClass}>
              {Object.entries(WORK_MODES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {fieldError('workMode')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="location">
              Location {form.workMode === 'REMOTE' ? '(optional)' : '(required)'}
            </label>
            <input id="location" name="location" value={form.location} onChange={onChange} className={inputClass} />
            {fieldError('location')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="durationWeeks">Duration (weeks, 1 to 52)</label>
            <input
              id="durationWeeks"
              name="durationWeeks"
              type="number"
              min="1"
              max="52"
              required
              value={form.durationWeeks}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('durationWeeks')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="stipendPerMonth">
              Stipend (₹ per month, 0 = unpaid)
            </label>
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
            <label className="block text-sm font-medium" htmlFor="openings">Number of openings</label>
            <input
              id="openings"
              name="openings"
              type="number"
              min="1"
              required
              value={form.openings}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('openings')}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="applicationDeadline">Application deadline</label>
            <input
              id="applicationDeadline"
              name="applicationDeadline"
              type="date"
              required
              value={form.applicationDeadline}
              onChange={onChange}
              className={inputClass}
            />
            {fieldError('applicationDeadline')}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create draft'}
          </button>
          <Link to="/company/internships" className="text-sm text-slate-600 hover:text-indigo-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}