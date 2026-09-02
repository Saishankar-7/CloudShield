import { ShieldCheck, Sun, Moon, Radio, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const displayRole = isAdmin ? 'Super Admin' : 'Employee';

  return (
    <header className="navbar">
      <div className="navbar-welcome">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Welcome back,</span>
            <span className="text-gradient">{user.fullName}</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className={`role-badge ${user.role}`}>{displayRole}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user.department || 'Engineering'} • ID: {user.employeeId || 'EMP-2026'}
            </span>
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Zero Trust Continuous Verification Badge */}
        <div className="zt-mesh-badge">
          <span className="zt-pulse-dot"></span>
          <ShieldCheck size={14} />
          <span>ZT-MESH: ACTIVE 99.9%</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Enterprise Light' : 'Cyber Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun size={16} className="sun-icon" />
              <span className="theme-toggle-text">Light</span>
            </>
          ) : (
            <>
              <Moon size={16} className="moon-icon" />
              <span className="theme-toggle-text">Cyber</span>
            </>
          )}
        </button>

        {/* Top-Right Profile Pill */}
        <div className="navbar-profile-pill">
          <div
            className="avatar"
            style={{
              width: '30px',
              height: '30px',
              fontSize: '0.75rem',
              backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
              backgroundColor: 'var(--primary)'
            }}
          >
            {!user.avatarUrl && user.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user.fullName}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Risk: {user.riskScore || 15} (Low)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
