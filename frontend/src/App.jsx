import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import MentorDashboard from './pages/MentorDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="STUDENT" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="COMPANY" />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="MENTOR" />}>
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<p className="text-center text-slate-600">Page not found</p>} />
      </Route>
    </Routes>
  )
}

export default App