import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddUserPage from './pages/AddUserPage'
import UsersPage from './pages/UsersPage'
import RoomsPage from './pages/RoomsPage'
import AdmissionsPage from './pages/AdmissionsPage'
import AllocationsPage from './pages/AllocationsPage'
import OccupancyPage from './pages/OccupancyPage'
import ComplaintsPage from './pages/ComplaintsPage'
import NoticesPage from './pages/NoticesPage'
import AttendancePage from './pages/AttendancePage'
import MyRoomPage from './pages/MyRoomPage'
import MyFeesPage from './pages/MyFeesPage'
import ProfilePage from './pages/ProfilePage'
import FeesPage from './pages/FeesPage'
import StudentDetailPage from './pages/StudentDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="add-user" element={<AddUserPage />} />
          </Route>
          <Route path="users" element={<UsersPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="occupancy" element={<OccupancyPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'WARDEN']} />}>
            <Route path="students/:studentId" element={<StudentDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="fees" element={<FeesPage />} />
          </Route>
          <Route path="my-room" element={<MyRoomPage />} />
          <Route path="my-fees" element={<MyFeesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
