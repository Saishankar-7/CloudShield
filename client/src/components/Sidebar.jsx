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
  KeyRound,
  Radio,
  FileCode,
  ShieldAlert
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

  // Organized menus with section categorizations
  const employeeMenu = [
    { section: 'OPERATIONS', items: [
      { name: 'Command Center', path: '/', icon: LayoutDashboard },
      { name: 'Resource Vault', path: '/resources', icon: FolderLock },
      { name: 'Access Requests', path: '/requests', icon: Inbox },
    ]},
    { section: 'GOVERNANCE & IDENTITY', items: [
      { name: 'Access History', path: '/history', icon: History },
      { name: 'Identity Profile', path: '/profile', icon: User },
      { name: 'Security Posture', path: '/security', icon: Lock },
    ]}
  ];

  const adminMenu = [
    { section: 'SOC COMMAND', items: [
      { name: 'Admin Command', path: '/admin', icon: LayoutDashboard },
      { name: 'Risk Telemetry', path: '/admin/risk', icon: Activity },
      { name: 'Security Audit Logs', path: '/admin/logs', icon: Terminal },
    ]},
    { section: 'ACCESS MANAGEMENT', items: [
      { name: 'User Directory', path: '/admin/users', icon: Users },
      { name: 'Resource Catalog', path: '/admin/resources', icon: FolderLock },
      { name: 'Access Approvals', path: '/admin/requests', icon: Inbox },
      { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    ]}
  ];

  const currentMenu = isAdmin ? adminMenu : employeeMenu;

  return (
    <aside className="sidebar">
      <NavLink
        to={isAdmin ? '/admin' : '/'}
        className="sidebar-logo"
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <BrandLogo size={32} glow={true} />
        <div>
          <div className="sidebar-logo-text">
            <span>CLOUD</span><span style={{ color: 'var(--primary, #38bdf8)' }}>SHIELD</span>
          </div>
          <span className="sidebar-logo-sub">Zero Trust Core</span>
        </div>
      </NavLink>

      <nav className="sidebar-nav-container">
        {currentMenu.map((group) => (
          <div key={group.section} className="sidebar-section-group">
            <span className="sidebar-section-title">{group.section}</span>
            <ul className="sidebar-menu">
              {group.items.map((item) => (
                <li key={item.name} className="sidebar-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                    end={item.path === '/' || item.path === '/admin'}
                  >
                    <item.icon size={18} className="sidebar-nav-icon" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-telemetry-badge">
          <span className="telemetry-live-dot"></span>
          <span>ZT Engine: Active</span>
        </div>

        <div className="sidebar-user">
          <div
            className="avatar"
            style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
          >
            {!user.avatarUrl && user.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="user-info">
            <div className="user-name">{user.fullName}</div>
            <div className="user-role">{user.jobTitle || (isAdmin ? 'Security Officer' : 'Staff Engineer')}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-full btn-sm sidebar-logout-btn"
        >
          <LogOut size={15} />
          <span>Secure Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
