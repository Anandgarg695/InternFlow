export const INTERVIEW_TYPES = {
  TECHNICAL: 'Technical',
  HR: 'HR',
  MANAGERIAL: 'Managerial',
  PANEL: 'Panel',
}

export const INTERVIEW_MODES = {
  ONLINE: 'Online (video)',
  ONSITE: 'On-site',
}

export const INTERVIEW_STATUS = {
  SCHEDULED: { label: 'Scheduled', style: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: 'Confirmed', style: 'bg-green-100 text-green-700' },
  RESCHEDULE_REQUESTED: { label: 'Reschedule requested', style: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', style: 'bg-slate-100 text-slate-700' },
  CANCELLED: { label: 'Cancelled', style: 'bg-red-100 text-red-700' },
}

export const ACTIVE_STATUSES = ['SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED']

// Shown in the viewer's own time zone
export const formatWhen = (iso) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// Converts a stored time into the value a datetime-local input expects (local time)
export const toLocalInput = (iso) => {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Only https links are ever rendered as links
export const safeHttps = (url) => (url && /^https:\/\//i.test(url) ? url : null)