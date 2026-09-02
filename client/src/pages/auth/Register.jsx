import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import { UserPlus, AlertCircle, CheckCircle2, User, Mail, Lock, Building, Briefcase, Phone, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('Engineering');
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register({
        fullName,
        email,
        password,
        department,
        jobTitle,
        phone,
        workLocation: 'India',
        employeeType: 'Full Time',
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <BrandLogo size={56} glow={true} />
          </div>
          <h1 className="auth-title">Register with CloudShield</h1>
          <p className="auth-subtitle">Establish your Zero Trust employee profile</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>Account created! Redirecting to secure gateway...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} style={{ color: 'var(--primary)' }} />
              <span>Full Name</span>
            </label>
            <input
              className="form-input"
              type="text"
              id="fullName"
              placeholder="e.g. Sai Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} />
              <span>Enterprise Email</span>
            </label>
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
            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} />
              <span>Create Password</span>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="department" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={14} style={{ color: 'var(--primary)' }} />
                <span>Department</span>
              </label>
              <select
                className="form-input"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">HR</option>
                <option value="IT Security">IT Security</option>
                <option value="Product Development">Product</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="jobTitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={14} style={{ color: 'var(--primary)' }} />
                <span>Job Title</span>
              </label>
              <input
                className="form-input"
                type="text"
                id="jobTitle"
                placeholder="Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={14} style={{ color: 'var(--primary)' }} />
              <span>Phone Number</span>
            </label>
            <input
              className="form-input"
              type="tel"
              id="phone"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
            style={{ marginTop: 12, height: '44px', gap: 10, fontSize: '0.9rem' }}
          >
            {loading ? (
              <span>Registering Profile...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register Secure Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already registered? <Link to="/login" className="auth-link">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
