export const WORK_MODES = {
  REMOTE: 'Remote',
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
}

export const formatStipend = (amount) =>
  amount > 0 ? `₹${amount.toLocaleString('en-IN')} / month` : 'Unpaid'

export const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })