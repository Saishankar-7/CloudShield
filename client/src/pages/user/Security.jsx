import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import {
  KeyRound,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  QrCode,
  Zap,
} from 'lucide-react';

const Security = () => {
  const { user, refreshProfile } = useAuth();
  const [setupData, setSetupData] = useState(null); // stores secret, qrCodeUrl, inAppOtp, email
  const [activeTab, setActiveTab] = useState('app'); // 'app' (Google Authenticator) or 'inapp' (Passcode)
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
      setSuccess('MFA setup initialized! Scan the QR code with Google/Microsoft Authenticator, or check the verification OTP sent to your registered email.');
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
      const data = await apiFetch('/auth/mfa/confirm', {
        method: 'POST',
        body: { token: code },
      });

      setSuccess(data.message || 'Multi-Factor Authentication activated successfully on your account!');
      setSetupData(null);
      setCode('');
      localStorage.setItem('sim_mfa_verified', 'true');
      refreshProfile(); // update user context
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please check your Authenticator app or email OTP.');
      setLoading(false);
    }
  };

  const handleCopySecret = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFill = (fillCode) => {
    setCode(fillCode);
    setError('');
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? Your account security level will be downgraded.')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/mfa/disable', {
        method: 'POST',
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
        <p className="page-subtitle">Configure multi-factor tokens, authenticator apps, and zero-trust verification</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={20} style={{ color: 'var(--primary)' }} />
            <span>Multi-Factor Authentication (MFA)</span>
          </h2>
        </div>

        <div style={{ marginTop: 24 }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--danger-text)',
                backgroundColor: 'var(--danger-bg)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: 20,
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--success-text)',
                backgroundColor: 'var(--success-bg)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* MFA Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: user.security?.mfaEnabled ? '#f0fdf4' : '#fff5f5',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: user.security?.mfaEnabled ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: user.security?.mfaEnabled ? 'var(--success)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {user.security?.mfaEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>
                MFA Status: {user.security?.mfaEnabled ? 'ENABLED & ACTIVE' : 'DISABLED'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.security?.mfaEnabled
                  ? 'Your account is secured with Zero-Trust Multi-Factor Authentication (Authenticator App & On-Screen Passcodes) on every login and confidential resource access.'
                  : 'Your account is currently without MFA. Enroll below to secure your access.'}
              </span>
            </div>
          </div>

          {/* MFA Enrollment Button */}
          {!user.security?.mfaEnabled && !setupData && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Enrolling in MFA protects your sessions using Google Authenticator, Microsoft Authenticator, or Zero-Trust instant verification passcodes.
              </p>
              <button onClick={handleStartSetup} className="btn btn-primary" disabled={loading}>
                {loading ? 'Initializing MFA Setup...' : 'Enroll in Multi-Factor Authentication'}
              </button>
            </div>
          )}

          {/* Setup Wizard Active */}
          {setupData && !user.security?.mfaEnabled && (
            <div
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone (or enter the 6-digit verification OTP sent to your registered email <strong>{user.email}</strong>):
                </p>

                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                  {setupData.qrCodeUrl && (
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        display: 'inline-block',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <img
                        src={setupData.qrCodeUrl}
                        alt="MFA QR Code"
                        style={{ width: '160px', height: '160px', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                        📱 Authenticator App Setup
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        Open Google or Microsoft Authenticator, tap add account (+), and point your camera at the QR code.
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        ✉️ An email OTP has also been sent to: <strong>{user.email}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleConfirmSetup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otpCode" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Enter 6-Digit Code from Authenticator App or Email OTP
                  </label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="form-input"
                      style={{
                        maxWidth: '180px',
                        fontSize: '1.4rem',
                        letterSpacing: '5px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        height: '44px',
                      }}
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
                      <span>{cooldown > 0 ? `Regenerate (${cooldown}s)` : 'Regenerate Code'}</span>
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
                Multi-Factor Authentication is actively protecting your account logins and secured enterprise assets.
              </p>
              <button onClick={handleDisableMfa} className="btn btn-danger btn-sm" disabled={loading}>
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

