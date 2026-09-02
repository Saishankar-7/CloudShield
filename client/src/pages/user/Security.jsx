import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { KeyRound, ShieldAlert, CheckCircle, AlertCircle, Copy } from 'lucide-react';

const Security = () => {
  const { user, refreshProfile } = useAuth();
  const [setupData, setSetupData] = useState(null); // stores secret and qrCodeUrl
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartSetup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/mfa/setup', { method: 'POST' });
      setSetupData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to initialize MFA setup.');
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      const data = await apiFetch('/auth/mfa/confirm', {
        method: 'POST',
        body: { token: code },
      });

      setSuccess(data.message || 'MFA enabled successfully.');
      setSetupData(null);
      setCode('');
      refreshProfile(); // update user context
    } catch (err) {
      setError(err.message || 'MFA confirmation failed. Verify the code.');
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? This increases account risk score.')) {
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const data = await apiFetch('/auth/mfa/disable', {
        method: 'POST'
      });
      
      setSuccess(data.message || 'MFA disabled successfully.');
      localStorage.setItem('sim_mfa_verified', 'false');
      refreshProfile();
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to disable MFA.');
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Credential Security Settings</h1>
        <p className="page-subtitle">Configure multi-factor tokens, passwords, and recovery backups</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={20} style={{ color: 'var(--primary)' }} />
            <span>Multi-Factor Authentication (MFA)</span>
          </h2>
        </div>

        <div style={{ marginTop: 24 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '12px 16px', borderRadius: '8px', marginBottom: 20, fontSize: '0.85rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', padding: '12px 16px', borderRadius: '8px', marginBottom: 20, fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* MFA Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: user.security?.mfaEnabled ? '#f0fdf4' : '#fff5f5', marginBottom: 24 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: user.security?.mfaEnabled ? 'var(--success-bg)' : 'var(--danger-bg)', color: user.security?.mfaEnabled ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
              {user.security?.mfaEnabled ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>
                MFA status: {user.security?.mfaEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.security?.mfaEnabled 
                  ? 'Your account is secured with two-factor authorization challenge.' 
                  : 'Your account is in high-risk state. Unrecognized locations will block logins.'}
              </span>
            </div>
          </div>

          {/* MFA Enrollment Form / Wizard */}
          {!user.security?.mfaEnabled && !setupData && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Enrolling in MFA protects your profile from unauthorized device logins and locations.
              </p>
              <button onClick={handleStartSetup} className="btn btn-primary" disabled={loading}>
                {loading ? 'Initializing Setup Wizard...' : 'Enroll in Multi-Factor Authentication'}
              </button>
            </div>
          )}

          {/* Setup Wizard Active */}
          {setupData && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>MFA Authenticator Setup Wizard</h3>
              
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
                <img
                  src={setupData.qrCodeUrl}
                  alt="MFA QR Code Setup"
                  style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: 8, backgroundColor: '#fff', width: '150px', height: '150px' }}
                />
                
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p>1. Scan the QR code using Google Authenticator, Microsoft Authenticator, or Duo Mobile.</p>
                  <p>2. Alternatively, enter the manual setup key:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontSize: '1.05rem', padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                      {setupData.secret}
                    </code>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmSetup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otpCode">Confirm Setup Code</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: '180px', fontSize: '1.1rem', letterSpacing: '2px', textAlign: 'center', fontFamily: 'monospace' }}
                      type="text"
                      maxLength="6"
                      id="otpCode"
                      placeholder="e.g. 123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <button type="submit" className="btn btn-primary">Enable MFA Token</button>
                  </div>
                </div>
                <div style={{ padding: '12px', border: '1px dashed #f59e0b', backgroundColor: '#fffbeb', borderRadius: '8px', fontSize: '0.725rem', color: '#92400e', lineHeight: 1.3, marginTop: 12 }}>
                  <b>Hint:</b> Enter code <code>123456</code> to verify and register successfully.
                </div>
              </form>
            </div>
          )}

          {/* MFA Enabled: Option to disable for testing */}
          {user.security?.mfaEnabled && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Multi-Factor Authentication is currently securing your user login sessions.
              </p>
              <button
                onClick={handleDisableMfa}
                className="btn btn-danger btn-sm"
                disabled={loading}
              >
                {loading ? 'Disabling MFA...' : 'Disable Multi-Factor Authentication'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Security;
