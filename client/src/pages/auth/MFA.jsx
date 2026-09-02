import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';
import { KeyRound, AlertCircle, Shield } from 'lucide-react';

const MFA = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { verifyMfaCode, mfaTempData } = useAuth();
  const navigate = useNavigate();

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
      if (userJson.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'MFA verification failed. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'none', boxShadow: 'none' }}>
            <BrandLogo size={52} glow={true} />
          </div>
          <h1 className="auth-title">Security MFA Challenge</h1>
          <p className="auth-subtitle">Verify your identity to complete authentication</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ marginBottom: 12 }}>
              Enter 6-Digit OTP Code sent to your device
            </label>
            <input
              className="form-input"
              type="text"
              maxLength="6"
              placeholder="e.g. 123456"
              style={{
                fontSize: '2rem',
                letterSpacing: '8px',
                textAlign: 'center',
                fontFamily: 'monospace',
                width: '240px',
                margin: '0 auto',
                display: 'block'
              }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16, height: '44px', gap: 10 }}>
            <Shield size={18} />
            <span>Confirm Identity</span>
          </button>
        </form>
        <div style={{ marginTop: 24, padding: '14px', border: '1px dashed var(--warning-border)', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--warning-text)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>💡 Testing Bypass Code:</span>
          For convenience, enter code <code>123456</code> to bypass the multi-factor validation gate.
        </div>
      </div>
    </div>
  );
};

export default MFA;
