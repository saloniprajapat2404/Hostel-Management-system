import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import RoomsPage from './pages/RoomsPage'
import AdmissionsPage from './pages/AdmissionsPage'
import AllocationsPage from './pages/AllocationsPage'
import OccupancyPage from './pages/OccupancyPage'
import ComplaintsPage from './pages/ComplaintsPage'
import NoticesPage from './pages/NoticesPage'
import AttendancePage from './pages/AttendancePage'
import MyRoomPage from './pages/MyRoomPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="occupancy" element={<OccupancyPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="my-room" element={<MyRoomPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
