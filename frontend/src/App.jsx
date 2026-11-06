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
import CompanyInterviews from './pages/CompanyInterviews'
import StudentInterviews from './pages/StudentInterviews'
import CompanyOffers from './pages/CompanyOffers'
import StudentOffers from './pages/StudentOffers'
import CompanyMentors from './pages/CompanyMentors'
import CompanyInterns from './pages/CompanyInterns'
import StudentPlacements from './pages/StudentPlacements'
import MentorInterns from './pages/MentorInterns'
import MentorTasks from './pages/MentorTasks'
import StudentTasks from './pages/StudentTasks'
import MentorEvaluation from './pages/MentorEvaluation'
import CompanyInternProgress from './pages/CompanyInternProgress'
import StudentCompletion from './pages/StudentCompletion'
import VerifyCertificate from './pages/VerifyCertificate'
import AdminUsers from './pages/AdminUsers'
import Notifications from './pages/Notifications'
import CompanyGradeTheory from './pages/CompanyGradeTheory'
import InterviewRoom from './pages/InterviewRoom'
import CompanyAnalytics from './pages/CompanyAnalytics'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:code" element={<VerifyCertificate />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Authenticated Video Interview Room */}
        <Route element={<ProtectedRoute />}>
          <Route path="/interview-room/:roomCode" element={<InterviewRoom />} />
        </Route>

        <Route element={<ProtectedRoute role="STUDENT" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/internships" element={<StudentInternships />} />
          <Route path="/student/internships/:id" element={<InternshipDetail />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/applications/:id/test" element={<StudentTest />} />
          <Route path="/student/interviews" element={<StudentInterviews />} />
          <Route path="/student/offers" element={<StudentOffers />} />
          <Route path="/student/placements" element={<StudentPlacements />} />
          <Route path="/student/placements/:placementId/tasks" element={<StudentTasks />} />
          <Route path="/student/placements/:placementId/completion" element={<StudentCompletion />} />
        </Route>
        <Route element={<ProtectedRoute role="COMPANY" />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/analytics" element={<CompanyAnalytics />} />
          <Route path="/company/profile" element={<CompanyProfile />} />
          <Route path="/company/internships" element={<CompanyInternships />} />
          <Route path="/company/internships/new" element={<InternshipForm />} />
          <Route path="/company/internships/:id/edit" element={<InternshipForm />} />
          <Route path="/company/internships/:id/applicants" element={<CompanyApplicants />} />
          <Route path="/company/internships/:id/rounds" element={<CompanyRounds />} />
          <Route path="/company/internships/:id/rounds/:round" element={<CompanyTest />} />
          <Route path="/company/internships/:id/rounds/:round/grade/:applicationId" element={<CompanyGradeTheory />} />
          <Route path="/company/internships/:id/interviews" element={<CompanyInterviews />} />
          <Route path="/company/internships/:id/offers" element={<CompanyOffers />} />
          <Route path="/company/mentors" element={<CompanyMentors />} />
          <Route path="/company/internships/:id/interns" element={<CompanyInterns />} />
          <Route path="/company/placements/:id" element={<CompanyInternProgress />} />
        </Route>
        <Route element={<ProtectedRoute role="MENTOR" />}>
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/interns" element={<MentorInterns />} />
          <Route path="/mentor/interns/:placementId/tasks" element={<MentorTasks />} />
          <Route path="/mentor/interns/:placementId/evaluation" element={<MentorEvaluation />} />
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<p className="text-center text-slate-600">Page not found</p>} />
      </Route>
    </Routes>
  )
}

export default App
