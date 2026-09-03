import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';
import {
  KeyRound,
  AlertCircle,
  Shield,
  Smartphone,
  Mail,
  RefreshCw,
} from 'lucide-react';

const MFA = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const { verifyMfaCode, mfaTempData } = useAuth();
  const navigate = useNavigate();

  const targetEmail = mfaTempData?.maskedEmail || mfaTempData?.email || 'your registered email';

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

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');
    try {
      // Small timeout to emulate resend trigger
      await new Promise((r) => setTimeout(r, 600));
      setResendSuccess(`A new verification code has been dispatched to ${targetEmail}`);
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
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

        {resendSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#065f46',
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 18,
              fontSize: '0.85rem',
            }}
          >
            <Mail size={18} style={{ flexShrink: 0, color: '#059669' }} />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* Email Dispatch Notice */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
            <Mail size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
              Security Code Dispatched
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enter the 6-digit code sent to <strong>{targetEmail}</strong> or your Authenticator app.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Smartphone size={15} style={{ color: 'var(--primary)' }} />
              <span>Enter 6-Digit Verification Code</span>
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
            style={{ marginTop: 18, height: '44px', gap: 10 }}
          >
            <Shield size={18} />
            <span>Confirm Zero-Trust Identity</span>
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: resending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            <span>{resending ? 'Sending new code...' : 'Did not receive code? Resend Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFA;
