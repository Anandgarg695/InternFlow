export const TASK_STATUS = {
  ASSIGNED: { label: 'To do', style: 'bg-blue-100 text-blue-700' },
  SUBMITTED: { label: 'Waiting for review', style: 'bg-amber-100 text-amber-700' },
  CHANGES_REQUESTED: { label: 'Changes requested', style: 'bg-red-100 text-red-700' },
  REVIEWED: { label: 'Reviewed', style: 'bg-green-100 text-green-700' },
}

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export { safeHttps } from './interview'