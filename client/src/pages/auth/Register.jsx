import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';
import { UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'none', boxShadow: 'none' }}>
            <BrandLogo size={52} glow={true} />
          </div>
          <h1 className="auth-title">Register with CloudShield</h1>
          <p className="auth-subtitle">Establish your Zero Trust employee profile</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Account created! Redirecting to secure gateway...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              className="form-input"
              type="text"
              id="fullName"
              placeholder="e.g. Sai Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Enterprise Email</label>
            <input
              className="form-input"
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Create Password</label>
            <input
              className="form-input"
              type="password"
              id="password"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department</label>
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
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="jobTitle">Job Title</label>
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
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              className="form-input"
              type="tel"
              id="phone"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8, height: '44px', gap: 10 }}>
            <UserPlus size={18} />
            <span>Register Secure Profile</span>
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
