import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';
import { User, Laptop, ShieldCheck, MapPin, Calendar, Smartphone } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading security profile...
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Enterprise Identity Profile</h1>
        </div>
        <p className="page-subtitle">Zero Trust authentication token and directory settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column: User Summary */}
        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="avatar"
            style={{
              width: '100px',
              height: '100px',
              fontSize: '2.5rem',
              backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
              backgroundColor: '#4f46e5',
              marginBottom: 16
            }}
          >
            {!user.avatarUrl && user.fullName.split(' ').map((n) => n[0]).join('')}
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>{user.fullName}</h2>
          <span className={`role-badge ${user.role}`} style={{ marginBottom: 20 }}>
            {user.role === 'admin' ? 'Super Administrator' : user.role === 'manager' ? 'Department Manager' : 'Security Employee'}
          </span>

          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.8rem', display: 'flex', justifyItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Employee ID</span>
                <span style={{ fontWeight: 600 }}>{user.employeeId}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', justifyItems: 'center', gap: 8 }}>
              <User size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Department / Title</span>
                <span style={{ fontWeight: 600 }}>{user.department} — {user.jobTitle}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', justifyItems: 'center', gap: 8 }}>
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primary Work Location</span>
                <span style={{ fontWeight: 600 }}>{user.workLocation || 'India'}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', justifyItems: 'center', gap: 8 }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Joined Company</span>
                <span style={{ fontWeight: 600 }}>{new Date(user.joinedOn || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Devices and Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Sessions */}
          <div className="glass-card">
            <h2 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Laptop size={18} style={{ color: 'var(--primary)' }} />
              <span>Active Security Sessions</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {user.activeSessions && user.activeSessions.map((session, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    border: `1px solid ${session.current ? 'var(--success-border)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: session.current ? 'var(--success-bg)' : 'var(--bg-card-subtle)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: session.current ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                        border: `1px solid ${session.current ? 'var(--success-border)' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: session.current ? 'var(--success)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Laptop size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: 2 }}>
                        {session.device}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        IP: {session.ip} • Location: {session.location}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {session.current && (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        Current Session
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Active: {new Date(session.lastActiveAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {(!user.activeSessions || user.activeSessions.length === 0) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active sessions recorded.</p>
              )}
            </div>
          </div>

          {/* Trusted Devices list */}
          <div className="glass-card">
            <h2 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} style={{ color: 'var(--primary)' }} />
              <span>Trusted Devices Directory</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {user.trustedDevices && user.trustedDevices.map((device, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: device.isTrusted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: device.isTrusted ? 'var(--success)' : 'var(--warning)',
                        flexShrink: 0,
                      }}
                    >
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: 2 }}>
                        {device.deviceName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Location: {device.location} • Last Seen: {new Date(device.lastUsedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${device.isTrusted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {device.isTrusted ? 'Device Trusted' : 'Unregistered Device'}
                    </span>
                  </div>
                </div>
              ))}
              {(!user.trustedDevices || user.trustedDevices.length === 0) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No devices registered for this user.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
