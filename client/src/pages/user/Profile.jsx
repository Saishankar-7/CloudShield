import { useAuth } from '../../context/AuthContext';
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
        <h1 className="page-title">Enterprise Identity Profile</h1>
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
                <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: session.current ? '#f0fdf4' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Laptop size={18} style={{ color: session.current ? 'var(--success)' : 'var(--text-muted)' }} />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{session.device}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP: {session.ip} • Location: {session.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {session.current && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Current Session</span>}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Smartphone size={18} style={{ color: device.isTrusted ? 'var(--success)' : 'var(--warning)' }} />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{device.deviceName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {device.location} • Last Seen: {new Date(device.lastUsedAt).toLocaleDateString()}</span>
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
