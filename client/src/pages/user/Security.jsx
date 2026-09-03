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
      setSuccess('MFA enrollment initialized! Scan the QR code or enter the verification passcode.');
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
      setError(err.message || 'Invalid or expired verification code. Please check your Authenticator app or on-screen passcode.');
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
              {/* Method Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('app')}
                  className={`btn btn-sm ${activeTab === 'app' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Smartphone size={15} />
                  <span>Authenticator App (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inapp')}
                  className={`btn btn-sm ${activeTab === 'inapp' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Zap size={15} />
                  <span>Instant Passcode / Render</span>
                </button>
              </div>

              {/* Tab 1: Authenticator App */}
              {activeTab === 'app' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong> on your mobile phone:
                  </p>

                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                    {setupData.qrCodeUrl && (
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          display: 'inline-block',
                        }}
                      >
                        <img
                          src={setupData.qrCodeUrl}
                          alt="MFA QR Code"
                          style={{ width: '150px', height: '150px', display: 'block' }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Or enter this Secret Key manually:
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          marginBottom: 8,
                        }}
                      >
                        <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px', flex: 1 }}>
                          {setupData.formattedSecret || setupData.secret}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopySecret(setupData.secret)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          title="Copy Secret"
                        >
                          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Account: <strong>{user.email}</strong> • Issuer: <strong>CloudShield</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: In-App Passcode */}
              {activeTab === 'inapp' && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    For Render cloud environments, use this instant Zero-Trust security passcode:
                  </p>
                  <div
                    style={{
                      border: '1px solid #38bdf8',
                      background: 'rgba(14, 165, 233, 0.1)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                        Live Zero-Trust Passcode:
                      </span>
                      <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '4px', color: '#ffffff' }}>
                        {setupData.inAppOtp || '123456'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAutoFill(setupData.inAppOtp || '123456')}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Zap size={14} />
                      <span>Auto-Fill</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <form onSubmit={handleConfirmSetup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otpCode" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Enter 6-Digit Code from Authenticator App or Passcode
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

                <div
                  style={{
                    padding: '10px 12px',
                    border: '1px dashed var(--warning-border)',
                    backgroundColor: 'var(--warning-bg)',
                    borderRadius: '8px',
                    fontSize: '0.725rem',
                    color: 'var(--warning-text)',
                    lineHeight: 1.3,
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <b>Hint:</b> Enter the code from Google Authenticator, the on-screen passcode, or test code <code>123456</code>.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAutoFill('123456')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Use 123456
                  </button>
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

