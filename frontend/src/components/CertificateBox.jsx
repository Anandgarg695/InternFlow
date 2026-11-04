import { Link } from 'react-router-dom'
import { formatDateTime } from '../utils/application'

export default function CertificateBox({ certificate }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm">
      <p className="font-medium text-emerald-800">Certificate issued on {formatDateTime(certificate.issuedAt)}</p>
      <p className="mt-1 text-slate-700">
        Verification code: <span className="font-mono font-semibold">{certificate.code}</span>
      </p>
      <Link to={`/verify/${certificate.code}`} className="mt-2 inline-block text-indigo-600 hover:underline">
        View and print the certificate
      </Link>
    </div>
  )
}