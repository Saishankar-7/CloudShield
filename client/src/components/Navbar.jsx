import { Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const displayRole = isAdmin ? 'Super Admin' : 'Employee';
  const notificationCount = isAdmin ? 5 : 3; // matching the screenshots

  return (
    <header className="navbar">
      <div className="navbar-welcome">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Welcome back, <span style={{ color: '#4f46e5' }}>{user.fullName}</span> !
        </h2>
        <span className={`role-badge ${user.role}`}>{displayRole}</span>
      </div>

      <div className="navbar-actions">
        {/* Shield compliance badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#10b981', fontWeight: 600, backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
          <ShieldCheck size={14} />
          <span>Gateway Active</span>
        </div>

        {/* Notifications Icon with Badge */}
        <button className="navbar-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge-dot"></span>
        </button>

        {/* Top-Right Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 6px', border: '1px solid #e2e8f0', borderRadius: '9999px', backgroundColor: '#f8fafc' }}>
          <div
            className="avatar"
            style={{
              width: '28px',
              height: '28px',
              fontSize: '0.75rem',
              backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
              backgroundColor: '#4f46e5'
            }}
          >
            {!user.avatarUrl && user.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
            {user.fullName}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
