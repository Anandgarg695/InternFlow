export const APPLICATION_STATUS = {
  APPLIED: { label: 'Applied', style: 'bg-blue-100 text-blue-700' },
  SHORTLISTED: { label: 'Shortlisted', style: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', style: 'bg-red-100 text-red-700' },
  WITHDRAWN: { label: 'Withdrawn', style: 'bg-slate-100 text-slate-700' },
}

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// Only http(s) links are ever rendered as links
export const safeUrl = (url) => (url && /^https?:\/\//i.test(url) ? url : null)