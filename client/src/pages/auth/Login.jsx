import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await login(email, password);
      
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
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={28} />
          </div>
          <h1 className="auth-title">CloudShield Gateway</h1>
          <p className="auth-subtitle">Zero Trust secure enterprise authorization</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem', fontWeight: 500 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Enterprise Email</label>
            <input
              className="form-input"
              type="email"
              id="email"
              placeholder="e.g. sai@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Security Password</label>
            <input
              className="form-input"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8, height: '44px', gap: 10 }}>
            <KeyRound size={18} />
            <span>Verify & Authenticate</span>
          </button>
        </form>

        {/* <div style={{ marginTop: 24, padding: '14px', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>💡 Demo Access Credentials:</span>
          • Employee: <code>sai@company.com</code> / <code>password123</code><br />
          • Admin: <code>admin@company.com</code> / <code>password123</code>
        </div> */}

        <div className="auth-footer">
          New employee? <Link to="/register" className="auth-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
