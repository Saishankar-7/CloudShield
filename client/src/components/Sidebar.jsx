import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard,
  Shield,
  History,
  User,
  Lock,
  LogOut,
  Users,
  FolderLock,
  Inbox,
  Terminal,
  Activity,
  BarChart3,
  KeyRound
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Navigation lists matching screenshots
  const employeeMenu = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Resources', path: '/resources', icon: FolderLock },
    { name: 'My Requests', path: '/requests', icon: Inbox },
    { name: 'Access History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Security', path: '/security', icon: Lock },
  ];

  const adminMenu = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Resources', path: '/admin/resources', icon: FolderLock },
    { name: 'Access Requests', path: '/admin/requests', icon: Inbox },
    { name: 'Security Logs', path: '/admin/logs', icon: Terminal },
    { name: 'Risk Monitor', path: '/admin/risk', icon: Activity },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
  ];

  const currentMenu = isAdmin ? adminMenu : employeeMenu;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BrandLogo size={32} glow={true} />
        <div>
          <span className="sidebar-logo-text">Cloud Shield</span>
          <span className="sidebar-logo-sub">Zero Trust Security</span>
        </div>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          {currentMenu.map((item) => (
            <li key={item.name} className="sidebar-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                end={item.path === '/' || item.path === '/admin'}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" style={{ marginBottom: 12 }}>
          <div
            className="avatar"
            style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
          >
            {!user.avatarUrl && user.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="user-info">
            <div className="user-name">{user.fullName}</div>
            <div className="user-role">{user.jobTitle || 'Employee'}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-full btn-sm"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
