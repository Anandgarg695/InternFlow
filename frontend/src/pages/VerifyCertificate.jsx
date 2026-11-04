import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../services/api'
import { formatDate } from '../utils/internship'
import { formatDateTime } from '../utils/application'

export default function VerifyCertificate() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(code ?? '')
  const [certificate, setCertificate] = useState(null)
  const [state, setState] = useState('idle')

  useEffect(() => {
    setInput(code ?? '')
    if (!code) {
      setCertificate(null)
      setState('idle')
      return
    }
    setState('loading')
    publicApi.get(`/public/certificates/${encodeURIComponent(code)}`)
      .then((res) => {
        setCertificate(res.data)
        setState('found')
      })
      .catch((err) => {
        setCertificate(null)
        setState(err.response?.status === 404 ? 'missing' : 'error')
      })
  }, [code])

  const onSubmit = (e) => {
    e.preventDefault()
    const value = input.trim()
    if (value) navigate(`/verify/${encodeURIComponent(value)}`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-indigo-600">Verify a certificate</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the verification code printed on the certificate.</p>
        <form onSubmit={onSubmit} className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="IF-XXXX-XXXX-XXXX"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
            Verify
          </button>
        </form>
      </div>

      {state === 'loading' && <p className="mt-6 text-slate-600">Checking...</p>}

      {state === 'missing' && (
        <p className="mt-6 rounded-xl bg-red-50 p-6 text-red-700 shadow">
          No certificate matches this code. Check the code and try again.
        </p>
      )}
      {state === 'error' && (
        <p className="mt-6 rounded-xl bg-white p-6 text-red-600 shadow">Could not reach the server. Try again later.</p>
      )}

      {state === 'found' && certificate && (
        <div className="mt-6 rounded-xl border-4 border-double border-indigo-300 bg-white p-10 text-center shadow">
          <p className="text-sm font-medium uppercase tracking-widest text-green-700">✓ Verified certificate</p>
          <h2 className="mt-4 text-3xl font-bold text-indigo-600">Certificate of Internship</h2>
          <p className="mt-6 text-slate-600">This is to certify that</p>
          <p className="mt-2 text-2xl font-semibold">{certificate.studentName}</p>
          <p className="mt-4 text-slate-600">successfully completed the internship</p>
          <p className="mt-2 text-xl font-semibold">{certificate.internshipTitle}</p>
          <p className="mt-2 text-slate-600">at</p>
          <p className="text-xl font-semibold">{certificate.companyName}</p>
          <p className="mt-4 text-slate-600">
            from {formatDate(certificate.startDate)} to {formatDate(certificate.endDate)}
          </p>
          <p className="mt-8 text-xs text-slate-500">
            Issued on {formatDateTime(certificate.issuedAt)} · Verification code{' '}
            <span className="font-mono">{certificate.code}</span>
          </p>
          <button
            onClick={() => window.print()}
            className="mt-6 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 print:hidden"
          >
            Print or save as PDF
          </button>
        </div>
      )}
    </div>
  )
}