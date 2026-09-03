import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';
import {
  KeyRound,
  AlertCircle,
  Shield,
  Smartphone,
  Copy,
  Check,
  Zap,
  Lock,
} from 'lucide-react';

const MFA = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { verifyMfaCode, mfaTempData } = useAuth();
  const navigate = useNavigate();

  const inAppOtp = mfaTempData?.inAppOtp;
  const targetEmail = mfaTempData?.maskedEmail || mfaTempData?.email || 'registered account email';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      await verifyMfaCode(code);
      const userJson = JSON.parse(localStorage.getItem('user'));
      if (userJson?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'MFA verification failed. Please check your code and try again.');
    }
  };

  const handleAutoFill = (fillCode) => {
    setCode(fillCode);
    setError('');
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'none', boxShadow: 'none' }}>
            <BrandLogo size={52} glow={true} />
          </div>
          <h1 className="auth-title">Zero Trust MFA Challenge</h1>
          <p className="auth-subtitle">Verify your identity to authenticate your session</p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--danger-text)',
              backgroundColor: 'var(--danger-bg)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 18,
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Live Zero-Trust On-Screen Security Passcode Banner (Render / Cloud Native) */}
        {inAppOtp && (
          <div
            style={{
              border: '1px solid #38bdf8',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(30, 58, 138, 0.2) 100%)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="zt-pulse-dot" style={{ width: 8, height: 8, backgroundColor: '#38bdf8' }}></span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Zero-Trust Security Passcode
                </span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Cloud Native</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    letterSpacing: '5px',
                    color: '#ffffff',
                    display: 'block',
                  }}
                >
                  {inAppOtp}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Dispatched for: <strong>{targetEmail}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleCopyCode(inAppOtp)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Copy code"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFill(inAppOtp)}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Zap size={14} />
                  <span>Auto-Fill</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Smartphone size={15} style={{ color: 'var(--primary)' }} />
              <span>Enter 6-Digit Code from Authenticator App or Passcode</span>
            </label>
            <input
              className="form-input"
              type="text"
              maxLength="6"
              placeholder="• • • • • •"
              style={{
                fontSize: '2rem',
                letterSpacing: '8px',
                textAlign: 'center',
                fontFamily: 'monospace',
                width: '230px',
                margin: '0 auto',
                display: 'block',
                fontWeight: 700,
                height: '50px',
              }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={code.length !== 6}
            style={{ marginTop: 16, height: '44px', gap: 10 }}
          >
            <Shield size={18} />
            <span>Confirm Zero-Trust Identity</span>
          </button>
        </form>

        {/* Verification Helper & Bypass */}
        <div
          style={{
            marginTop: 20,
            padding: '12px 14px',
            border: '1px dashed var(--warning-border)',
            backgroundColor: 'var(--warning-bg)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--warning-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <span style={{ fontWeight: 600, display: 'block' }}>💡 Quick Test Bypass:</span>
            <span>Enter code <code>123456</code> to immediately bypass the verification gate.</span>
          </div>
          <button
            type="button"
            onClick={() => handleAutoFill('123456')}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.7rem', flexShrink: 0 }}
          >
            Use 123456
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFA;

