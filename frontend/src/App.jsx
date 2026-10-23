import StudentProfile from './pages/StudentProfile'
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
import CompanyProfile from './pages/CompanyProfile'
import CompanyInternships from './pages/CompanyInternships'
import InternshipForm from './pages/InternshipForm'
import StudentInternships from './pages/StudentInternships'
import InternshipDetail from './pages/InternshipDetail'
import StudentApplications from './pages/StudentApplications'
import CompanyApplicants from './pages/CompanyApplicants'
import CompanyTest from './pages/CompanyTest'
import StudentTest from './pages/StudentTest'
import CompanyRounds from './pages/CompanyRounds'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="STUDENT" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/internships" element={<StudentInternships />} />
          <Route path="/student/internships/:id" element={<InternshipDetail />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/applications/:id/test" element={<StudentTest />} />
        </Route>
        <Route element={<ProtectedRoute role="COMPANY" />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/profile" element={<CompanyProfile />} />
          <Route path="/company/internships" element={<CompanyInternships />} />
          <Route path="/company/internships/new" element={<InternshipForm />} />
          <Route path="/company/internships/:id/edit" element={<InternshipForm />} />
          <Route path="/company/internships/:id/applicants" element={<CompanyApplicants />} />
          <Route path="/company/internships/:id/rounds" element={<CompanyRounds />} />
          <Route path="/company/internships/:id/rounds/:round" element={<CompanyTest />} />
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