import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import StatCard from '../../components/StatCard';
import ResourceCard from '../../components/ResourceCard';
import StatusBadge from '../../components/StatusBadge';
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
  Cloud,
  HardDrive,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'access' | 'mfa' | 'request' | null
  const [selectedRes, setSelectedRes] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestType, setRequestType] = useState('Read Only');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [accessData, setAccessData] = useState(null);

  // Simulation settings (saved in localStorage to propagate to apiFetch)
  const [simIp, setSimIp] = useState(localStorage.getItem('sim_ip') || '192.168.1.10');
  const [simCountry, setSimCountry] = useState(localStorage.getItem('sim_country') || 'India');
  const [simCity, setSimCity] = useState(localStorage.getItem('sim_city') || 'Mumbai');
  const [simDevice, setSimDevice] = useState(localStorage.getItem('sim_device_name') || 'Chrome 124 on Windows 11');
  const [simDeviceId, setSimDeviceId] = useState(localStorage.getItem('sim_device_id') || 'device-trusted-sai-win');
  const [simMfa, setSimMfa] = useState(localStorage.getItem('sim_mfa_verified') === 'true');

  const [showSimPanel, setShowSimPanel] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchDashboardData();
  }, [simIp, simCountry, simDevice, simMfa]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch employee stats
      const statsData = await apiFetch('/reports/employee');
      setStats(statsData);

      // 2. Fetch all catalog resources (evaluated for current Zero Trust profile)
      const resData = await apiFetch('/resources');
      setResources(resData);

      // 3. Fetch recent logs
      const logsData = await apiFetch('/logs/my');
      setLogs(logsData.slice(0, 5)); // recent 5 activities
      
      refreshProfile(); // refresh current user profile
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

  // Triggered when clicking "Access" or "Verify MFA"
  const handleAccessResource = async (resource) => {
    setSelectedRes(resource);
    setErrorCleanups();

    if (resource.decision === 'MFA_Required') {
      // Trigger MFA verification modal
      setActiveModal('mfa');
    } else {
      // Directly fetch resource contents
      try {
        const data = await apiFetch(`/resources/${resource._id}`);
        setAccessData(data.resource);
        setActiveModal('access');
        fetchDashboardData(); // update stats/logs
      } catch (err) {
        alert(err.message || 'Access Denied.');
      }
    }
  };

  // Submit MFA Code for Resource Access
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError('');

    if (mfaCode === '123456') {
      // Set verification flag in session headers
      localStorage.setItem('sim_mfa_verified', 'true');
      setSimMfa(true);

      try {
        const data = await apiFetch(`/resources/${selectedRes._id}`);
        setAccessData(data.resource);
        setActiveModal('access');
        setMfaCode('');
        fetchDashboardData();
      } catch (err) {
        setMfaError(err.message || 'MFA validation failed.');
        localStorage.setItem('sim_mfa_verified', 'false');
        setSimMfa(false);
      }
    } else {
      setMfaError('Invalid MFA verification code. Use code 123456.');
    }
  };

  // Submit Request Access
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess(false);

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
      }, 1800);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request.');
    }
  };

  const handleOpenRequest = (resource) => {
    setSelectedRes(resource);
    setErrorCleanups();
    setActiveModal('request');
  };

  const setErrorCleanups = () => {
    setMfaError('');
    setRequestError('');
    setRequestSuccess(false);
    setAccessData(null);
  };

  // Update simulated headers
  const handleSaveSimulation = (e) => {
    e.preventDefault();
    localStorage.setItem('sim_ip', simIp);
    localStorage.setItem('sim_country', simCountry);
    localStorage.setItem('sim_city', simCity);
    localStorage.setItem('sim_device_name', simDevice);
    
    const isTrusted = simDevice.includes('Windows 11') && simIp === '192.168.1.10';
    const newDevId = isTrusted ? 'device-trusted-sai-win' : 'device-unrecognized-id';
    localStorage.setItem('sim_device_id', newDevId);
    setSimDeviceId(newDevId);

    // Reset MFA verification state when client headers change
    localStorage.setItem('sim_mfa_verified', 'false');
    setSimMfa(false);
    
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

    localStorage.setItem('sim_ip', '192.168.1.10');
    localStorage.setItem('sim_country', 'India');
    localStorage.setItem('sim_city', 'Mumbai');
    localStorage.setItem('sim_device_name', 'Chrome 124 on Windows 11');
    localStorage.setItem('sim_device_id', 'device-trusted-sai-win');
    localStorage.setItem('sim_mfa_verified', 'false');
    
    fetchDashboardData();
  };

  if (!user || !stats) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading Secure Dashboard...
      </div>
    );
  }

  const isLocationIndia = simCountry === 'India';
  const isDeviceTrusted = simDeviceId === 'device-trusted-sai-win';

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Employee Security Terminal</h1>
          <p className="page-subtitle">Continuous Zero Trust access evaluation</p>
        </div>

        {/* Toggle Simulation Button */}
        <button
          onClick={() => setShowSimPanel(!showSimPanel)}
          className="btn btn-secondary"
          style={{ gap: 8, display: 'flex', alignItems: 'center', borderColor: '#cbd5e1' }}
        >
          <Sliders size={16} />
          <span>Simulate Client Environment</span>
        </button>
      </div>

      {/* Simulation Drawer */}
      {showSimPanel && (
        <div className="sim-controls-panel" style={{ border: '1px solid #ddd6fe', backgroundColor: '#faf5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede9fe', paddingBottom: 10 }}>
            <h3 style={{ fontSize: '0.95rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} />
              <span>Zero Trust Request Context Simulator</span>
            </h3>
            <button onClick={handleResetSimulation} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Reset to Default
            </button>
          </div>
          
          <form onSubmit={handleSaveSimulation} className="sim-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated IP Address</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simIp}
                onChange={(e) => setSimIp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated Country</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simCountry}
                onChange={(e) => setSimCountry(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated City</label>
              <input
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simCity}
                onChange={(e) => setSimCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Simulated User-Agent (Device)</label>
              <select
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={simDevice}
                onChange={(e) => setSimDevice(e.target.value)}
              >
                <option value="Chrome 124 on Windows 11">Chrome on Windows 11 (Trusted)</option>
                <option value="Safari 17 on macOS Sonoma">Safari on macOS Sonoma (Unrecognized)</option>
                <option value="Firefox 125 on Linux Ubuntu">Firefox on Linux Ubuntu (Unrecognized)</option>
                <option value="Opera 110 on Android Mobile">Opera on Android Mobile (Unrecognized)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 20 }}>
              <button type="submit" className="btn btn-primary btn-full btn-sm" style={{ height: '38px' }}>
                Apply Context Parameters
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
          trendText="Your access profile is secure"
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
          title="MFA Required"
          value={stats.mfaCount}
          icon={KeyRound}
          iconColor="var(--warning)"
          iconBg="var(--warning-bg)"
          trendText="This Week"
          sparklineData={stats.trends.mfaTrend}
          sparklineColor="var(--warning)"
        />
      </div>

      {/* Grid: Available Resources (Left) & Recent Access Activity (Right) */}
      <div className="dashboard-grid">
        {/* Available Resources (Left Card) */}
        <div className="glass-card">
          <div className="card-title-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="card-title">Catalog Assets & Cloud Documents ({filteredResources.length})</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zero-Trust evaluated resources and secure cloud PDF files
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
                style={{ paddingLeft: 30, fontSize: '0.78rem', height: '32px' }}
              />
            </div>
          </div>

          {/* Filter Category Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 16px 0' }}>
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
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  border: `1px solid ${selectedCategory === cat.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : '#ffffff',
                  color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
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

        {/* Recent Access Activity (Right Card) */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Recent Access Activity</h2>
          </div>

          <div className="activity-list">
            {logs.map((log) => (
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
                No recent activity logged for this security profile.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Status Bar */}
      <div className="footer-status-bar glass-card">
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

      {/* Modals definitions */}

      {/* 1. Modal: Access Confirmed / Display Resource Contents */}
      {activeModal === 'access' && selectedRes && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem', color: 'var(--success-text)' }}>✓ Access Approved</h2>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>{selectedRes.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category: {selectedRes.category} • Path: {selectedRes.identifier}</p>
                </div>
              </div>
              
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secure Payload</span>

                {/* Cloud PDF File Display */}
                {(selectedRes.cloudStorage?.isCloudPdf || selectedRes.type === 'PDF Document') ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: 14 }}>
                      <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px' }}>
                        <FileText size={28} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                            {selectedRes.cloudStorage?.fileName || selectedRes.name + '.pdf'}
                          </h4>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {selectedRes.cloudStorage?.provider || 'Cloud Storage'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          <span>Size: {selectedRes.cloudStorage?.fileSize || '2.4 MB'}</span>
                          {selectedRes.cloudStorage?.bucketName && <span> • Bucket: {selectedRes.cloudStorage.bucketName}</span>}
                          <span> • Encrypted: {selectedRes.cloudStorage?.encryption || 'AES-256'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedRes.cloudStorage?.fileUrl && (
                      <div>
                        {selectedRes.cloudStorage.fileUrl.endsWith('.pdf') || selectedRes.cloudStorage.fileType === 'application/pdf' ? (
                          <div style={{ marginBottom: 12 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                              Live Zero-Trust Document Stream:
                            </span>
                            <iframe
                              src={selectedRes.cloudStorage.fileUrl}
                              title="Decrypted Document"
                              style={{
                                width: '100%',
                                height: '260px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#f1f5f9',
                              }}
                            />
                          </div>
                        ) : null}

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <a
                            href={selectedRes.cloudStorage.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
                          >
                            <ExternalLink size={14} />
                            <span>Open in Full Tab</span>
                          </a>
                          <a
                            href={selectedRes.cloudStorage.fileUrl}
                            download={selectedRes.cloudStorage?.fileName || 'secure-document.pdf'}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
                          >
                            <HardDrive size={14} />
                            <span>Download to Laptop</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {selectedRes.name === 'Documents' && (
                      <p>📄 <b>Company Policy Directive:</b> All local file shares must be encrypted via IPSec tunneling. Remote endpoints require MFA challenge tokens for session establishment.</p>
                    )}
                    {selectedRes.name === 'Reports' && (
                      <p>📊 <b>Engineering Metrics Q3:</b> Code delivery velocity increased by 18% following automation pipelines implementation. Zero Trust validation intercepts active on all DB cluster connections.</p>
                    )}
                    {selectedRes.name === 'Employee Data' && (
                      <p>👥 <b>Database Records decrypted successfully:</b> Authorized Manager Access. User <b>Sai Kumar</b> belongs to Engineering department. Security risk level score evaluated at 15.</p>
                    )}
                    {selectedRes.name === 'Dashboard Analytics' && (
                      <p>📈 <b>Analytics Stream:</b> Session success rate is 99.8%. Continuous verification intercepted 1,280 authentication logs this week. High risk warnings decreased by 12%.</p>
                    )}
                    {!['Documents', 'Reports', 'Employee Data', 'Dashboard Analytics'].includes(selectedRes.name) && (
                      <p>🔒 <b>Secure Stream Decrypted:</b> Zero Trust verification passed. Session token verified against endpoint <code>{selectedRes.identifier}</code>.</p>
                    )}
                  </>
                )}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem', color: 'var(--warning-text)' }}>🔒 Identity Verification Required</h2>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleMfaSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 20 }}>
                  Accessing <b>{selectedRes.name}</b> requires multi-factor authentication due to resource sensitivity ({selectedRes.sensitivity}).
                </p>

                {mfaError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem', fontWeight: 500 }}>
                    {mfaError}
                  </div>
                )}

                <div className="form-group" style={{ textAlign: 'center' }}>
                  <label className="form-label">Enter 6-Digit OTP</label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    style={{ fontSize: '1.5rem', letterSpacing: '6px', textAlign: 'center', fontFamily: 'monospace', width: '180px', margin: '0 auto', display: 'block' }}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div style={{ marginTop: 16, padding: '12px', border: '1px dashed #f59e0b', backgroundColor: '#fffbeb', borderRadius: '8px', fontSize: '0.725rem', color: '#92400e', lineHeight: 1.3 }}>
                  <b>Testing Code:</b> Enter bypass code <code>123456</code> to verify this challenge.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--warning)' }}>Verify & Access</button>
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
