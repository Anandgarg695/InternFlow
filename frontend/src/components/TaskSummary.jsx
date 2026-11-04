export default function TaskSummary({ tasks }) {
  return (
    <p className="text-sm text-slate-600">
      {tasks.total} tasks · {tasks.reviewed} reviewed · {tasks.waitingForReview} waiting for review ·{' '}
      {tasks.changesRequested} need changes · {tasks.toDo} to do
      {tasks.averageRating != null && ` · average rating ${tasks.averageRating} / 5`}
    </p>
  )
}