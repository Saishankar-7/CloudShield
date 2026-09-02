import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import { KeyRound, ShieldAlert, CheckCircle, AlertCircle, Mail, RefreshCw, ShieldCheck } from 'lucide-react';

const Security = () => {
  const { user, refreshProfile } = useAuth();
  const [setupData, setSetupData] = useState(null); // stores email and maskedEmail
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleStartSetup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/mfa/setup', { method: 'POST' });
      setSetupData(data);
      setCooldown(45);
      setSuccess(data.message || 'MFA verification code sent to your registered email.');
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

    setLoading(true);
    try {
      const data = await apiFetch('/auth/mfa/verify', {
        method: 'POST',
        body: { code },
      });

      setSuccess(data.message || 'Email MFA activated successfully on your account!');
      setSetupData(null);
      setCode('');
      localStorage.setItem('sim_mfa_verified', 'true');
      refreshProfile(); // update user context
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please check your email.');
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Email MFA? Your account security level will be downgraded.')) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Credential Security Settings</h1>
        </div>
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
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: user.security?.mfaEnabled ? 'var(--success-bg)' : 'var(--danger-bg)', color: user.security?.mfaEnabled ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.security?.mfaEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>
                MFA status: {user.security?.mfaEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.security?.mfaEnabled 
                  ? 'Your account is secured with email OTP multi-factor authentication on every login and sensitive resource access.' 
                  : 'Your account is currently without MFA. Enroll below to secure your access.'}
              </span>
            </div>
          </div>

          {/* MFA Enrollment Form / Wizard */}
          {!user.security?.mfaEnabled && !setupData && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Enrolling in Email MFA verifies your identity with a one-time passcode sent directly to your registered inbox.
              </p>
              <button onClick={handleStartSetup} className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending OTP to Email...' : 'Enroll in Multi-Factor Authentication'}
              </button>
            </div>
          )}

          {/* Setup Wizard Active */}
          {setupData && !user.security?.mfaEnabled && (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Mail size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Email OTP Verification</h3>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                A 6-digit verification code was sent to: <b>{setupData.maskedEmail || setupData.email}</b>. Enter it below to activate MFA.
              </p>

              <form onSubmit={handleConfirmSetup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otpCode">Enter 6-Digit Email OTP</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: '180px', fontSize: '1.3rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}
                      type="text"
                      maxLength="6"
                      id="otpCode"
                      placeholder="• • • • • •"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                      {loading ? 'Activating...' : 'Verify & Enable MFA'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleStartSetup}
                      disabled={loading || cooldown > 0}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                      <span>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* MFA Enabled: Option to disable */}
          {user.security?.mfaEnabled && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Multi-Factor Authentication is actively protecting your account logins and secured assets.
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
