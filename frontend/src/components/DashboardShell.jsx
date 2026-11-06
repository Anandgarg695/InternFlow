import { useSelector } from 'react-redux'

export default function DashboardShell({ title, description, children }) {
  const user = useSelector((state) => state.auth.user)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Portal</span>
              <span>/</span>
              <span>{user?.role}</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <strong className="text-slate-800">{user?.fullName}</strong>. {description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active Session
            </span>
          </div>
        </div>

        {children && <div className="mt-6 pt-6 border-t border-slate-100">{children}</div>}
      </div>
    </div>
  )
}
