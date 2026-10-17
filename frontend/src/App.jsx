import { useEffect, useState } from 'react'
import api from './services/Api'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <h1 className="text-3xl font-bold text-indigo-600">InternFlow</h1>
        <p className="mt-2 text-slate-600">Frontend is running.</p>
        <p className="mt-4 text-sm">
          {error && <span className="text-red-600">Backend not reachable</span>}
          {!error && !health && <span className="text-slate-500">Checking backend...</span>}
          {health && (
            <span className="text-green-600">
              Backend: {health.status} | Database: {health.database}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default App