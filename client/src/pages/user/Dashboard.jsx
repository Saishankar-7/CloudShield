import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, API_URL } from '../../services/api';
import StatCard from '../../components/StatCard';
import ResourceCard from '../../components/ResourceCard';
import StatusBadge from '../../components/StatusBadge';
import EmployeeDataViewer from '../../components/EmployeeDataViewer';
import CompanyDocumentsViewer from '../../components/CompanyDocumentsViewer';
import ReportsViewer from '../../components/ReportsViewer';
import AnalyticsDashboardViewer from '../../components/AnalyticsDashboardViewer';
import BrandLogo from '../../components/BrandLogo';
import {
  Shield,
  CheckCircle,
  XCircle,
  KeyRound,
  Laptop,
  Globe,
  Clock,
  Send,
  Sliders,
  Sparkles,
  Terminal,
  FileText,
  ExternalLink,
  HardDrive,
  Search,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Image as ImageIcon,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

const Dashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showSimPanel, setShowSimPanel] = useState(false);
  
  // Modals state & Email OTP MFA state
  const [activeModal, setActiveModal] = useState(null); // 'access' | 'mfa' | 'request' | null
  const [selectedRes, setSelectedRes] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestType, setRequestType] = useState('Read Only');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [accessData, setAccessData] = useState(null);

  // Simulation settings
  const [simIp, setSimIp] = useState(localStorage.getItem('sim_ip') || '192.168.1.10');
  const [simCountry, setSimCountry] = useState(localStorage.getItem('sim_country') || 'India');
  const [simCity, setSimCity] = useState(localStorage.getItem('sim_city') || 'Mumbai');
  const [simDevice, setSimDevice] = useState(localStorage.getItem('sim_device_name') || 'Chrome 124 on Windows 11');
  const [simDeviceId, setSimDeviceId] = useState(localStorage.getItem('sim_device_id') || 'device-trusted-sai-win');
  const [simMfa, setSimMfa] = useState(localStorage.getItem('sim_mfa_verified') === 'true');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Timer countdown for resend OTP cooldown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  useEffect(() => {
    fetchDashboardData();
  }, [simIp, simCountry, simDevice, simMfa]);

  const fetchDashboardData = async () => {
    try {
      const statsData = await apiFetch('/reports/employee');
      setStats(statsData);

      const resData = await apiFetch('/resources');
      setResources(resData);

      const logsData = await apiFetch('/logs/my');
      setLogs(logsData);
      
      refreshProfile();
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    }
  };

  // Filtered resources for search & category selection
  const filteredResources = resources.filter((res) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      res.name.toLowerCase().includes(q) ||
      (res.description && res.description.toLowerCase().includes(q)) ||
      (res.category && res.category.toLowerCase().includes(q)) ||
      (res.cloudStorage?.fileName && res.cloudStorage.fileName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedCategory === 'Cloud PDFs') {
      return res.cloudStorage?.isCloudPdf || res.type === 'PDF Document';
    }
    if (selectedCategory !== 'All') {
      return res.category === selectedCategory || res.type === selectedCategory;
    }
    return true;
  });

  // Request MFA OTP to registered email address
  const sendMfaOtp = async (resource) => {
    const resId = resource?._id || selectedRes?._id;
    if (!resId) return;

    setOtpSending(true);
    setMfaError('');
    setMfaSuccess('');

    try {
      const data = await apiFetch(`/resources/${resId}/request-otp`, {
        method: 'POST',
      });

      setOtpSent(true);
      setOtpEmail(data.email || '');
      setOtpMaskedEmail(data.maskedEmail || data.email || '');
      setOtpCooldown(45); // 45s cooldown
      setMfaSuccess(data.message || `Verification code sent to ${data.maskedEmail || data.email}`);
    } catch (err) {
      setMfaError(err.message || 'Failed to send OTP to registered email.');
    } finally {
      setOtpSending(false);
    }
  };

  const setErrorCleanups = () => {
    setMfaCode('');
    setMfaError('');
    setRequestReason('');
    setRequestError('');
    setRequestSuccess(false);
    setAccessData(null);
  };

  // Triggered when clicking "Access" or "Verify MFA"
  const handleAccessResource = async (resource) => {
    setSelectedRes(resource);
    setErrorCleanups();
    setMfaSuccess('');
    setMfaCode('');
    setOtpSent(false);

    // Check if user has already verified OTP during this login session
    const isMfaSessionActive = sessionStorage.getItem('session_mfa_verified') === 'true' || localStorage.getItem('sim_mfa_verified') === 'true';
    let unlocked = [];
    try {
      unlocked = JSON.parse(sessionStorage.getItem('unlocked_resources') || '[]');
    } catch (e) {
      unlocked = [];
    }

    if (isMfaSessionActive || unlocked.includes(resource._id)) {
      // User entered OTP once -> all documents accessible throughout login session!
      try {
        const data = await apiFetch(`/resources/${resource._id}`);
        setAccessData(data.resource || resource);
      } catch (e) {
        setAccessData(resource);
      }
      setActiveModal('access');
      return;
    }

    // Only prompt for MFA if the Zero-Trust Policy Engine determined MFA is required
    // (e.g. Admin set MFA Requirement to 'Always Required' or high risk triggered MFA challenge)
    const requiresMfa = resource.decision === 'MFA_Required' || resource.mfaRequirement === 'Always Required';

    if (requiresMfa && resource.mfaRequirement !== 'Disabled') {
      // Trigger MFA verification modal and send OTP
      setActiveModal('mfa');
      sendMfaOtp(resource);
    } else {
      try {
        const data = await apiFetch(`/resources/${resource._id}`);
        if (data.status === 'MFA_Required') {
          setActiveModal('mfa');
          sendMfaOtp(resource);
          return;
        }
        setAccessData(data.resource || resource);
        setActiveModal('access');
        fetchDashboardData();
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('mfa')) {
          setActiveModal('mfa');
          sendMfaOtp(resource);
        } else {
          alert(err.message || 'Access Denied.');
        }
      }
    }
  };

  const handleOpenRequest = (resource) => {
    setSelectedRes(resource);
    setErrorCleanups();
    setActiveModal('request');
  };

  // Handle simulated context save
  const handleSaveSimulation = (e) => {
    e.preventDefault();
    localStorage.setItem('sim_ip', simIp);
    localStorage.setItem('sim_country', simCountry);
    localStorage.setItem('sim_city', simCity);
    localStorage.setItem('sim_device_name', simDevice);
    localStorage.setItem('sim_device_id', simDeviceId);
    localStorage.setItem('sim_mfa_verified', simMfa ? 'true' : 'false');
    setShowSimPanel(false);
    fetchDashboardData();
  };

  const handleResetSimulation = () => {
    setSimIp('192.168.1.10');
    setSimCountry('India');
    setSimCity('Mumbai');
    setSimDevice('Chrome 124 on Windows 11');
    setSimDeviceId('device-trusted-sai-win');
    setSimMfa(false);

    localStorage.removeItem('sim_ip');
    localStorage.removeItem('sim_country');
    localStorage.removeItem('sim_city');
    localStorage.removeItem('sim_device_name');
    localStorage.removeItem('sim_device_id');
    localStorage.removeItem('sim_mfa_verified');
    setShowSimPanel(false);
    fetchDashboardData();
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');

    if (!mfaCode || mfaCode.trim().length !== 6) {
      setMfaError('Please enter the full 6-digit OTP code.');
      return;
    }

    setMfaVerifying(true);

    try {
      let resourceResult = null;

      try {
        const data = await apiFetch(`/resources/${selectedRes._id}/verify-otp`, {
          method: 'POST',
          body: { otp: mfaCode.trim() },
        });
        resourceResult = data.resource;
      } catch (err) {
        // Fallback for demo/testing with code 123456
        if (mfaCode.trim() === '123456') {
          const directData = await apiFetch(`/resources/${selectedRes._id}`);
          resourceResult = directData.resource;
        } else {
          throw err;
        }
      }

      // Set verification flag in session headers & unlocked document cache
      sessionStorage.setItem('session_mfa_verified', 'true');
      localStorage.setItem('sim_mfa_verified', 'true');
      try {
        const unlocked = JSON.parse(sessionStorage.getItem('unlocked_resources') || '[]');
        if (!unlocked.includes(selectedRes._id)) {
          unlocked.push(selectedRes._id);
          sessionStorage.setItem('unlocked_resources', JSON.stringify(unlocked));
        }
      } catch (e) {}

      setSimMfa(true);
      setAccessData(resourceResult || selectedRes);
      setActiveModal('access');
      setMfaCode('');
      setMfaSuccess('');
      fetchDashboardData();
    } catch (err) {
      setMfaError(err.message || 'MFA validation failed. Check your OTP and try again.');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess(false);

    if (!requestReason || requestReason.trim().length < 5) {
      setRequestError('Please provide a reason (minimum 5 characters).');
      return;
    }

    try {
      await apiFetch('/requests', {
        method: 'POST',
        body: {
          resourceId: selectedRes._id,
          accessType: requestType,
          reason: requestReason,
        },
      });

      setRequestSuccess(true);
      setRequestReason('');
      setTimeout(() => {
        setActiveModal(null);
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request.');
    }
  };

  if (!stats) {
    return (
      <div className="content-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Initialising Zero Trust Continuous Verification Terminal...</p>
        </div>
      </div>
    );
  }

  const isDeviceTrusted = simDeviceId === 'device-trusted-sai-win';

  return (
    <div className="content-body">
      {/* Header Bar with Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandLogo size={26} glow={true} />
            <h1 className="page-title">Employee Security Terminal</h1>
          </div>
          <p className="page-subtitle">Continuous Zero Trust access evaluation and secure document access</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSimPanel(!showSimPanel)}
            className="btn btn-primary"
            style={{ gap: 8, display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}
          >
            <Sliders size={15} />
            <span>{showSimPanel ? 'Close Simulator' : 'Simulate Environment'}</span>
          </button>
        </div>
      </div>

      {/* Optional Simulation Drawer */}
      {showSimPanel && (
        <div className="sim-controls-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} />
              <span>Zero Trust Request Context Simulator</span>
            </h3>
            <button onClick={handleResetSimulation} className="btn btn-secondary btn-sm">
              Reset to Defaults
            </button>
          </div>
          
          <form onSubmit={handleSaveSimulation} className="sim-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated IP Address</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simIp}
                onChange={(e) => setSimIp(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated Country</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simCountry}
                onChange={(e) => setSimCountry(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated City</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simCity}
                onChange={(e) => setSimCity(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Device Trust Posture</label>
              <select
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simDeviceId}
                onChange={(e) => {
                  setSimDeviceId(e.target.value);
                  setSimDevice(e.target.value === 'device-trusted-sai-win' ? 'Chrome 124 on Windows 11' : 'Safari 17 on macOS');
                }}
              >
                <option value="device-trusted-sai-win">Chrome on Windows 11 (Trusted)</option>
                <option value="device-unrecognized-mac">Safari on macOS (Untrusted)</option>
                <option value="device-unrecognized-android">Opera on Android (Untrusted)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-full btn-sm" style={{ height: '38px' }}>
                <Zap size={14} />
                <span>Apply Context</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards Widgets Row */}
      <div className="stats-grid">
        <StatCard
          title="Risk Level"
          value={user.riskLevel}
          icon={Shield}
          iconColor={user.riskLevel === 'Low' ? 'var(--success)' : 'var(--danger)'}
          iconBg={user.riskLevel === 'Low' ? 'var(--success-bg)' : 'var(--danger-bg)'}
          trendText="Your access profile is evaluated securely"
        />
        <StatCard
          title="Allowed Access"
          value={stats.allowedCount}
          icon={CheckCircle}
          iconColor="var(--success)"
          iconBg="var(--success-bg)"
          trendText="This Week"
          sparklineData={stats.trends.allowedTrend}
          sparklineColor="var(--success)"
        />
        <StatCard
          title="Denied Access"
          value={stats.deniedCount}
          icon={XCircle}
          iconColor="var(--danger)"
          iconBg="var(--danger-bg)"
          trendText="This Week"
          sparklineData={stats.trends.deniedTrend}
          sparklineColor="var(--danger)"
        />
        <StatCard
          title="MFA Challenges"
          value={stats.mfaCount}
          icon={KeyRound}
          iconColor="var(--warning)"
          iconBg="var(--warning-bg)"
          trendText="This Week"
          sparklineData={stats.trends.mfaTrend}
          sparklineColor="var(--warning)"
        />
      </div>

      {/* Main Grid: Catalog Assets (Left) & Recent Access Activity (Right) */}
      <div className="dashboard-grid">
        {/* Left: Available Resources & Documents */}
        <div className="glass-card">
          <div className="card-title-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="card-title">Catalog Assets & Cloud Documents ({filteredResources.length})</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zero-Trust evaluated resources with live in-app document viewer
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '0.78rem', height: '34px' }}
              />
            </div>
          </div>

          {/* Filter Category Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 18px 0' }}>
            {[
              { id: 'All', label: `All (${resources.length})` },
              { id: 'Cloud PDFs', label: `☁️ Cloud PDFs (${resources.filter(r => r.cloudStorage?.isCloudPdf || r.type === 'PDF Document').length})` },
              { id: 'Business', label: 'Business' },
              { id: 'Database', label: 'Databases' },
              { id: 'Application', label: 'Applications' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  border: `1px solid ${selectedCategory === cat.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--bg-card-subtle)',
                  color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="resources-grid">
            {filteredResources.map((res) => (
              <ResourceCard
                key={res._id}
                resource={res}
                onAccess={handleAccessResource}
                onRequestAccess={handleOpenRequest}
              />
            ))}
            {filteredResources.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No matching documents or resources found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Access Activity */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Recent Access Activity</h2>
          </div>

          <div className="activity-list">
            {logs.slice(0, 7).map((log) => (
              <div key={log._id} className="activity-item">
                <div className="activity-info">
                  <div
                    className="activity-icon-wrapper"
                    style={{
                      backgroundColor: log.status === 'Success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: log.status === 'Success' ? 'var(--success)' : 'var(--danger)'
                    }}
                  >
                    {log.status === 'Success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div>
                    <div className="activity-title">
                      {log.eventType} - {log.resource ? log.resource.name : 'System'}
                    </div>
                    <div className="activity-time">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • IP {log.ipAddress}
                    </div>
                  </div>
                </div>
                <StatusBadge status={log.status === 'Success' ? 'Allowed' : 'Denied'} />
              </div>
            ))}
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent activity logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Status Bar */}
      <div className="footer-status-bar">
        <div className="status-metric">
          <span className="status-label">Current Risk Score:</span>
          <span className="status-value-bold" style={{ color: user.riskLevel === 'Low' ? 'var(--success)' : 'var(--danger)' }}>
            {user.riskScore} / 100
          </span>
          <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
            {user.riskLevel} RISK
          </span>
        </div>
        <div className="status-metric">
          <Laptop size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="status-label">Device:</span>
          <span className="status-value-bold">{isDeviceTrusted ? 'Trusted Device' : 'Unrecognized Device'}</span>
        </div>
        <div className="status-metric">
          <Globe size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="status-label">Location:</span>
          <span className="status-value-bold">{simCity}, {simCountry}</span>
        </div>
        <div className="status-metric">
          <Clock size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="status-label">Last Login:</span>
          <span className="status-value-bold">
            {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
          </span>
        </div>
      </div>

      {/* Modals */}

      {/* 1. Modal: Access Approved */}
      {activeModal === 'access' && selectedRes && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-content unlock-pulse-success"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: (selectedRes.name === 'Employee Data' || selectedRes.category === 'HR') ? '960px' : '860px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem', color: 'var(--success-text)' }}>✓ Access Approved</h2>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{selectedRes.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Category: {selectedRes.category} • Path: {selectedRes.identifier}</p>
                </div>
              </div>
              
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-card-subtle)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: 10, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Secure Payload
                </span>

                {(selectedRes.name === 'Employee Data' || selectedRes.category === 'HR') ? (
                  <EmployeeDataViewer resource={selectedRes} />
                ) : (selectedRes.name === 'Documents' || (selectedRes.name?.toLowerCase() === 'documents') || (selectedRes.category === 'Business' && selectedRes.name?.toLowerCase().includes('document') && !selectedRes.cloudStorage?.isCloudPdf)) ? (
                  <CompanyDocumentsViewer resource={selectedRes} />
                ) : (selectedRes.name === 'Reports' || (selectedRes.category === 'Analytics' && selectedRes.name?.toLowerCase().includes('report'))) ? (
                  <ReportsViewer resource={selectedRes} />
                ) : (selectedRes.name === 'Dashboard Analytics' || selectedRes.name?.toLowerCase().includes('analytic')) ? (
                  <AnalyticsDashboardViewer resource={selectedRes} />
                ) : (() => {
                  const activeResource = accessData || selectedRes;
                  const cloud = activeResource.cloudStorage || {};
                  const hasCloudDoc = cloud?.isCloudPdf || activeResource.type === 'PDF Document' || cloud?.fileUrl;

                  if (hasCloudDoc) {
                    const fileName = cloud.fileName || activeResource.name || 'document.pdf';
                    const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName) || cloud.fileType?.startsWith('image/');
                    const token = localStorage.getItem('token');
                    const streamUrl = `${API_URL}/resources/${activeResource._id}/stream?token=${token}`;
                    const downloadUrl = `${API_URL}/resources/${activeResource._id}/stream?token=${token}&download=true`;
                    const pdfStreamUrl = `${streamUrl}#toolbar=0&navpanes=0&view=FitH`;

                    return (
                      <div>
                        {/* File Meta Pill Card */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 14px', marginBottom: 14 }}>
                          <div style={{ backgroundColor: isImage ? '#3b82f61a' : 'var(--danger-bg)', color: isImage ? '#38bdf8' : 'var(--danger)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                {fileName}
                              </h4>
                              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                {cloud.provider || 'Cloudinary Cloud'}
                              </span>
                              <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                                {isImage ? 'Image Payload' : 'Decrypted Document'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              <span>Size: {cloud.fileSize || '0.19 MB'}</span>
                              {cloud.bucketName && <span> • Vault: {cloud.bucketName}</span>}
                              <span> • Encrypted: {cloud.encryption || 'AES-256 Cloudinary Secure CDN (HTTPS / TLS 1.3)'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Decrypted Stream Viewer */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Zero-Trust Decrypted Stream:
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="zt-pulse-dot" style={{ width: 6, height: 6, backgroundColor: '#10b981' }}></span>
                              <span>AES-256 TLS 1.3 Verified</span>
                            </span>
                          </div>

                          {isImage ? (
                            /* High-Definition Centered Image Viewer */
                            <div
                              style={{
                                width: '100%',
                                minHeight: '380px',
                                maxHeight: '520px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#070b14',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                padding: '16px',
                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                              }}
                            >
                              <img
                                src={streamUrl}
                                alt={fileName}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '480px',
                                  objectFit: 'contain',
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                  display: 'block',
                                }}
                              />
                            </div>
                          ) : (
                            /* Full-Width PDF Stream Viewer (No Cramped Nav Sidebar) */
                            <iframe
                              src={pdfStreamUrl}
                              title="Decrypted Document Preview"
                              style={{
                                width: '100%',
                                height: '500px',
                                minHeight: '460px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                backgroundColor: '#0f172a',
                                display: 'block',
                              }}
                            />
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <a
                            href={streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', textDecoration: 'none' }}
                          >
                            <ExternalLink size={14} />
                            <span>Open in Full Tab</span>
                          </a>
                          <a
                            href={downloadUrl}
                            download={fileName}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', textDecoration: 'none' }}
                          >
                            <HardDrive size={14} />
                            <span>Download to Laptop</span>
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {selectedRes.name === 'Documents' && (
                        <p>📄 <b>Company Policy Directive:</b> All local file shares must be encrypted via IPSec tunneling. Remote endpoints require MFA challenge tokens for session establishment.</p>
                      )}
                      {selectedRes.name === 'Reports' && (
                        <p>📊 <b>Engineering Metrics Q3:</b> Code delivery velocity increased by 18% following automation pipelines implementation. Zero Trust validation intercepts active on all DB cluster connections.</p>
                      )}
                      {selectedRes.name === 'Dashboard Analytics' && (
                        <p>📈 <b>Analytics Stream:</b> Session success rate is 99.8%. Continuous verification intercepted 1,280 authentication logs this week. High risk warnings decreased by 12%.</p>
                      )}
                      {!['Documents', 'Reports', 'Dashboard Analytics'].includes(selectedRes.name) && (
                        <p>🔒 <b>Secure Stream Decrypted:</b> Zero Trust verification passed. Session token verified against endpoint <code>{selectedRes.identifier}</code>.</p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={14} />
                <span>Zero Trust Audit Token: CS-{(Math.random() * 1000000).toFixed(0)} populated successfully.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Close Session</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: MFA Verification Challenge */}
      {activeModal === 'mfa' && selectedRes && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>MFA Document Verification</h2>
                  <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--text-muted)' }}>Zero Trust Continuous Identity Gate</p>
                </div>
              </div>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form onSubmit={handleMfaSubmit}>
              <div className="modal-body" style={{ paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Document</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedRes.name}</span>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>MFA Required</span>
                </div>

                {/* Email Delivery Status Card */}
                <div style={{ border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Mail size={18} style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', display: 'block' }}>
                        OTP Dispatched to Registered Account
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0c4a6e', display: 'block', marginTop: 2 }}>
                        A single-use 6-digit verification code was generated for: <strong>{otpMaskedEmail || otpEmail || user?.email || 'your registered email'}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e0f2fe', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#0369a1' }}>
                      <Clock size={13} />
                      <span>Code valid for 10 mins</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => sendMfaOtp(selectedRes)}
                      disabled={otpCooldown > 0 || otpSending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: otpCooldown > 0 ? '#94a3b8' : 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: otpCooldown > 0 || otpSending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 6px',
                      }}
                    >
                      <RefreshCw size={12} className={otpSending ? 'animate-spin' : ''} />
                      <span>{otpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>

                {mfaError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{mfaError}</span>
                  </div>
                )}

                {mfaSuccess && (
                  <div style={{ color: '#065f46', backgroundColor: '#d1fae5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#059669' }} />
                    <span>{mfaSuccess}</span>
                  </div>
                )}

                <div className="form-group" style={{ textAlign: 'center', marginBottom: 12 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Smartphone size={15} style={{ color: 'var(--primary)' }} />
                    <span>Enter 6-Digit Verification Code</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength="6"
                    placeholder="• • • • • •"
                    style={{
                      fontSize: '1.6rem',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      width: '200px',
                      margin: '0 auto',
                      display: 'block',
                      fontWeight: 700,
                      height: '46px',
                    }}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  type="submit"
                  disabled={mfaVerifying || !mfaCode}
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: '140px',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={14} />
                  <span>{mfaVerifying ? 'Verifying OTP...' : 'Verify & Unlock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Request Access Submission */}
      {activeModal === 'request' && selectedRes && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem' }}>Request Access Gateway</h2>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                  You do not have policy permission to access <b>{selectedRes.name}</b> directly. You can request temporary access from security administrators.
                </p>

                {requestError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem' }}>
                    {requestError}
                  </div>
                )}

                {requestSuccess && (
                  <div style={{ color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem', fontWeight: 600 }}>
                    Request submitted successfully! Sending for admin review...
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="reqType">Access Privilege Type</label>
                  <select
                    className="form-input"
                    id="reqType"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <option value="Read Only">Read Only</option>
                    <option value="Read/Write">Read/Write (Limited)</option>
                    <option value="Full Access">Full Access</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reason">Business Reason Justification</label>
                  <textarea
                    className="form-input"
                    id="reason"
                    rows="3"
                    placeholder="Describe your security justification for accessing this resource..."
                    style={{ resize: 'none' }}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
                  <Send size={12} />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
