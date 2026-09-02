import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import ResourceCard from '../../components/ResourceCard';
import BrandLogo from '../../components/BrandLogo';
import {
  FolderLock,
  Shield,
  Terminal,
  KeyRound,
  Send,
  FileText,
  ExternalLink,
  HardDrive,
  Search,
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';

const MyResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal states & MFA email OTP states
  const [activeModal, setActiveModal] = useState(null);
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

  useEffect(() => {
    fetchResources();
  }, []);

  // Timer countdown for resend OTP cooldown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const fetchResources = async () => {
    try {
      const data = await apiFetch('/resources');
      setResources(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching resources:', err.message);
      setLoading(false);
    }
  };

  // Filtered resources
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
      setOtpCooldown(45); // 45s resend cooldown
      setMfaSuccess(`Security OTP has been sent to your registered email (${data.maskedEmail || data.email})`);
    } catch (err) {
      setMfaError(err.message || 'Failed to send OTP to registered email.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleAccessResource = async (resource) => {
    setSelectedRes(resource);
    setMfaError('');
    setMfaSuccess('');
    setMfaCode('');
    setAccessData(null);
    setOtpSent(false);

    // Any document/cloud PDF or MFA_Required resource triggers the MFA Email OTP challenge
    const isDocOrMfa =
      resource.decision === 'MFA_Required' ||
      resource.type === 'Document' ||
      resource.type === 'PDF Document' ||
      resource.cloudStorage?.isCloudPdf ||
      resource.sensitivity === 'High' ||
      resource.sensitivity === 'Critical';

    if (isDocOrMfa) {
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
        setAccessData(data.resource);
        setActiveModal('access');
        fetchResources();
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('mfa')) {
          setActiveModal('mfa');
          sendMfaOtp(resource);
        } else {
          alert(err.message || 'Access Blocked.');
        }
      }
    }
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
      const data = await apiFetch(`/resources/${selectedRes._id}/verify-otp`, {
        method: 'POST',
        body: { otp: mfaCode.trim() },
      });

      localStorage.setItem('sim_mfa_verified', 'true');
      setAccessData(data.resource);
      setActiveModal('access');
      setMfaCode('');
      setMfaSuccess('');
      fetchResources();
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
        fetchResources();
      }, 1500);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request.');
    }
  };

  const handleOpenRequest = (resource) => {
    setSelectedRes(resource);
    setRequestError('');
    setRequestSuccess(false);
    setActiveModal('request');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading enterprise resources...
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Enterprise Resources Directory</h1>
        </div>
        <p className="page-subtitle">Security catalog of files, databases, and microservices</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderLock size={20} style={{ color: 'var(--primary)' }} />
              <span>Resource Catalog ({filteredResources.length})</span>
            </h2>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search catalog or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 30, fontSize: '0.8rem', height: '34px' }}
            />
          </div>
        </div>

        {/* Filter Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          {[
            { id: 'All', label: `All (${resources.length})` },
            { id: 'Cloud PDFs', label: `☁️ Cloud PDFs (${resources.filter(r => r.cloudStorage?.isCloudPdf || r.type === 'PDF Document').length})` },
            { id: 'Business', label: 'Business' },
            { id: 'HR', label: 'HR' },
            { id: 'Database', label: 'Databases' },
            { id: 'Application', label: 'Applications' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '4px 12px',
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

        <div className="resources-grid" style={{ marginTop: 20 }}>
          {filteredResources.map((res) => (
            <ResourceCard
              key={res._id}
              resource={res}
              onAccess={handleAccessResource}
              onRequestAccess={handleOpenRequest}
            />
          ))}
          {filteredResources.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching resources or documents found in catalog.
            </div>
          )}
        </div>
      </div>

      {/* Modals definitions */}

      {/* 1. Modal: Access Confirmed */}
      {activeModal === 'access' && selectedRes && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem', color: 'var(--success-text)' }}>✓ Access Granted</h2>
              <button className="navbar-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>{selectedRes.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category: {selectedRes.category}</p>
                </div>
              </div>
              
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure Payload Contents</span>

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
                    {selectedRes.name === 'Admin Panel' && (
                      <p>💻 <b>Superuser Console Active:</b> System administrative functions unlocked. Firewalls, network clusters, and security policies are active and logging audit traces.</p>
                    )}
                    {!['Documents', 'Reports', 'Employee Data', 'Dashboard Analytics', 'Admin Panel'].includes(selectedRes.name) && (
                      <p>🔒 <b>Secure Stream Decrypted:</b> Zero Trust verification passed. Session token verified against endpoint <code>{selectedRes.identifier}</code>.</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Close Session</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: MFA Document Verification Challenge */}
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
                        OTP Sent to Registered Email Address
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0c4a6e', display: 'block', marginTop: 2 }}>
                        A single-use 6-digit verification code was sent to: <strong>{otpMaskedEmail || otpEmail || 'your registered account email'}</strong>
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
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Enter 6-Digit Email OTP</label>
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

      {/* 3. Modal: Request Access */}
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
                  You do not have policy permission to access <b>{selectedRes.name}</b>. Submit access justification below.
                </p>

                {requestError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem' }}>
                    {requestError}
                  </div>
                )}

                {requestSuccess && (
                  <div style={{ color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem', fontWeight: 600 }}>
                    Request submitted successfully!
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

export default MyResources;
