export const OFFER_STATUS = {
  OFFERED: { label: 'Pending', style: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Accepted', style: 'bg-green-100 text-green-700' },
  DECLINED: { label: 'Declined', style: 'bg-slate-100 text-slate-700' },
  WITHDRAWN: { label: 'Withdrawn by company', style: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expired', style: 'bg-amber-100 text-amber-700' },
}

// A yyyy-mm-dd value for a date input, `days` from today
export const dateInput = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}