import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import { KeyRound, AlertCircle, Mail, Lock, Eye, EyeOff, Sun, Moon, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authState, setAuthState] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthState('scanning');
    
    try {
      const res = await login(email, password);
      
      setAuthState('success');
      
      setTimeout(() => {
        if (res.mfaRequired) {
          navigate('/mfa');
        } else {
          const userJson = JSON.parse(localStorage.getItem('user') || '{}');
          if (userJson?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      }, 550);
    } catch (err) {
      setAuthState('error');
      setError(err.message || 'Authentication failed. Please verify security credentials.');
      // Auto clear error shake class after animation so user can re-attempt
      setTimeout(() => {
        setAuthState('idle');
      }, 500);
    }
  };

  const cardClass = `auth-card ${
    authState === 'scanning'
      ? 'scanning'
      : authState === 'success'
      ? 'success-portal'
      : authState === 'error'
      ? 'error-shake'
      : ''
  }`;

  return (
    <div className="auth-wrapper">
      {/* Top Right Theme Toggle */}
      <div className="auth-theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Enterprise Light' : 'Cyber Dark'} mode`}
          aria-label="Toggle Theme"
          type="button"
        >
          {isDark ? (
            <>
              <Sun size={15} className="sun-icon" />
              <span className="theme-toggle-text">Light</span>
            </>
          ) : (
            <>
              <Moon size={15} className="moon-icon" />
              <span className="theme-toggle-text">Cyber</span>
            </>
          )}
        </button>
      </div>

      <div className={cardClass}>
        {/* Holographic Laser Scanline during Authentication */}
        {authState === 'scanning' && <div className="auth-scanline-beam"></div>}

        <div className="auth-header">
          <div className="auth-logo">
            <BrandLogo size={56} glow={true} />
          </div>
          <h1 className="auth-title">CloudShield Gateway</h1>
          <p className="auth-subtitle">Zero Trust secure enterprise authorization</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem', fontWeight: 500 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} />
              <span>Enterprise Email</span>
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              placeholder="e.g. name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={authState === 'scanning' || authState === 'success'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} />
              <span>Security Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '42px' }}
                required
                disabled={authState === 'scanning' || authState === 'success'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={authState === 'scanning' || authState === 'success'}
            className={`btn btn-primary btn-full ${authState === 'success' ? 'btn-auth-success' : ''}`}
            style={{ marginTop: 12, height: '44px', gap: 10, fontSize: '0.9rem' }}
          >
            {authState === 'scanning' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying ZT-Credentials...</span>
              </>
            ) : authState === 'success' ? (
              <>
                <CheckCircle2 size={18} />
                <span>Identity Verified ✓</span>
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Verify & Authenticate</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          New to CloudShield? <Link to="/register" className="auth-link">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
