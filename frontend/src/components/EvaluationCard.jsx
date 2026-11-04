import { stars } from '../utils/task'

export default function EvaluationCard({ evaluation }) {
  return (
    <div className="rounded-md bg-slate-50 p-4 text-sm">
      <p className="font-medium text-amber-600">
        {stars(evaluation.overallRating)} <span className="text-slate-600">overall</span>
      </p>
      <p className="mt-2 font-medium text-slate-700">Strengths</p>
      <p className="whitespace-pre-line text-slate-600">{evaluation.strengths}</p>
      {evaluation.improvements && (
        <>
          <p className="mt-2 font-medium text-slate-700">Areas to improve</p>
          <p className="whitespace-pre-line text-slate-600">{evaluation.improvements}</p>
        </>
      )}
      {evaluation.comments && (
        <>
          <p className="mt-2 font-medium text-slate-700">Comments</p>
          <p className="whitespace-pre-line text-slate-600">{evaluation.comments}</p>
        </>
      )}
      {evaluation.mentorName && <p className="mt-3 text-xs text-slate-500">Written by {evaluation.mentorName}</p>}
    </div>
  )
}