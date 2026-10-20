import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/Api'

export default function DashboardShell({ title, description, pingPath }) {
  const user = useSelector((state) => state.auth.user)
  const [message, setMessage] = useState('Checking access...')

  useEffect(() => {
    api.get(pingPath)
      .then((res) => setMessage(`Backend says: ${res.data.message}`))
      .catch(() => setMessage('Backend refused access'))
  }, [pingPath])

  return (
    <div className="rounded-xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-indigo-600">{title}</h1>
      <p className="mt-1 text-slate-600">Welcome, {user.fullName}.</p>
      <p className="mt-4 text-slate-700">{description}</p>
      <p className="mt-6 inline-block rounded-md bg-green-50 px-3 py-1.5 text-sm text-green-700">
        {message}
      </p>
    </div>
  )
}