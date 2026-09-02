import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MFA from './pages/auth/MFA';

// User Pages
import Dashboard from './pages/user/Dashboard';
import MyResources from './pages/user/MyResources';
import MyRequests from './pages/user/MyRequests';
import AccessHistory from './pages/user/AccessHistory';
import Profile from './pages/user/Profile';
import Security from './pages/user/Security';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Resources from './pages/admin/Resources';
import AccessRequests from './pages/admin/AccessRequests';
import SecurityLogs from './pages/admin/SecurityLogs';
import RiskMonitor from './pages/admin/RiskMonitor';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';

// Shared Layout Wrapper for Sidebars and Top navbars
const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-panel">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mfa" element={<MFA />} />

          {/* Secure Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee', 'manager', 'admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/resources" element={<MyResources />} />
              <Route path="/requests" element={<MyRequests />} />
              <Route path="/history" element={<AccessHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/security" element={<Security />} />
            </Route>
          </Route>

          {/* Secure Admin-Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/resources" element={<Resources />} />
              <Route path="/admin/requests" element={<AccessRequests />} />
              <Route path="/admin/logs" element={<SecurityLogs />} />
              <Route path="/admin/risk" element={<RiskMonitor />} />
              <Route path="/admin/reports" element={<ReportsAnalytics />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
