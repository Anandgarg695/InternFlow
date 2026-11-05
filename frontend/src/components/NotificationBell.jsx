import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../services/api'

export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const location = useLocation()

  // Checks again after every page change, and every 30 seconds
  useEffect(() => {
    let active = true
    const load = () =>
      api.get('/notifications/unread-count')
        .then((res) => {
          if (active) setUnread(res.data.unread)
        })
        .catch(() => {})
    load()
    const timer = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [location.pathname])

  return (
    <Link to="/notifications" className="relative hover:text-indigo-600" aria-label="Notifications">
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}