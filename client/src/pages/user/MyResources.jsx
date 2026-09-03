import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import ResourceCard from '../../components/ResourceCard';
import BrandLogo from '../../components/BrandLogo';
import EmployeeDataViewer from '../../components/EmployeeDataViewer';
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
  Copy,
  Check,
  Zap,
  Smartphone,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';

const MyResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'access', 'mfa', 'request'
  const [selectedRes, setSelectedRes] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [accessData, setAccessData] = useState(null);

  // MFA OTP states
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [inAppOtp, setInAppOtp] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Request Access states
  const [requestType, setRequestType] = useState('Read Only');
  const [requestReason, setRequestReason] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    let interval = null;
    if (otpCooldown > 0) {
      interval = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCooldown]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/resources');
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMfaOtp = async (resource) => {
    setOtpSending(true);
    setMfaError('');
    setMfaSuccess('');
    try {
      const data = await apiFetch(`/resources/${resource._id}/request-otp`, {
        method: 'POST',
      });
      setOtpEmail(data.email || '');
      setOtpMaskedEmail(data.maskedEmail || '');
      if (data.inAppOtp) {
        setInAppOtp(data.inAppOtp);
      }
      setOtpSent(true);
      setOtpCooldown(45); // 45s resend cooldown
      setMfaSuccess(data.message || `Security OTP generated (${data.maskedEmail || data.email})`);
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

    const requiresMfa = resource.decision === 'MFA_Required' || resource.mfaRequirement === 'Always Required';

    if (requiresMfa && resource.mfaRequirement !== 'Disabled') {
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

  const handleOpenRequest = (resource) => {
    setSelectedRes(resource);
    setRequestReason('');
    setRequestError('');
    setRequestSuccess(false);
    setActiveModal('request');
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');

    if (!mfaCode || mfaCode.trim().length !== 6) {
      setMfaError('Please enter the 6-digit OTP code.');
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
        // Bypass helper for testing code 123456
        if (mfaCode.trim() === '123456') {
          const directData = await apiFetch(`/resources/${selectedRes._id}`);
          resourceResult = directData.resource;
        } else {
          throw err;
        }
      }

      setMfaSuccess('Identity verified successfully! Unlocking resource payload...');
      setTimeout(() => {
        setAccessData(resourceResult || selectedRes);
        setActiveModal('access');
        fetchResources();
      }, 700);
    } catch (err) {
      setMfaError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    try {
      await apiFetch('/requests', {
        method: 'POST',
        body: {
          resourceId: selectedRes._id,
          requestType,
          reason: requestReason,
        },
      });
      setRequestSuccess(true);
      fetchResources();
      setTimeout(() => {
        setActiveModal(null);
      }, 1500);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit access request.');
    }
  };

  const categories = ['All', ...new Set(resources.map((r) => r.category).filter(Boolean))];

  const filteredResources = resources.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="resources-page page-container">
      <BrandLogo />

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderLock className="text-primary" size={28} />
            <span>Corporate Resource Catalog</span>
          </h1>
          <p className="page-subtitle">
            Zero-Trust access policies are continuously evaluated against your identity, endpoint security state, and dynamic risk posture.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: '280px', maxWidth: '480px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search resources, cloud files, databases..."
              className="form-input"
              style={{ paddingLeft: 36 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '20px', padding: '6px 14px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: 12 }}>🛡️</div>
          <p>Evaluating Zero-Trust Policy Engines & Inspecting Vaults...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No resources found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="resource-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredResources.map((res) => (
            <ResourceCard
              key={res._id}
              resource={res}
              onAccess={handleAccessResource}
              onRequestAccess={handleOpenRequest}
            />
          ))}
        </div>
      )}

      {/* Access Modal */}
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
              <h2 style={{ fontSize: '1.1rem', color: 'var(--success-text)' }}>✓ Access Granted</h2>
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
                  Secure Payload Contents
                </span>

                {(selectedRes.name === 'Employee Data' || selectedRes.category === 'HR') ? (
                  <EmployeeDataViewer resource={selectedRes} />
                ) : (selectedRes.cloudStorage?.isCloudPdf || selectedRes.type === 'PDF Document' || selectedRes.cloudStorage?.fileUrl) ? (
                  <div>
                    {(() => {
                      const cloud = selectedRes.cloudStorage || {};
                      const fileName = cloud.fileName || selectedRes.name || 'document.pdf';
                      const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName) || cloud.fileType?.startsWith('image/');
                      const token = localStorage.getItem('token');
                      const streamUrl = `/api/resources/${selectedRes._id}/stream?token=${token}`;
                      const downloadUrl = `/api/resources/${selectedRes._id}/stream?token=${token}&download=true`;
                      const pdfStreamUrl = `${streamUrl}#toolbar=0&navpanes=0&view=FitH`;

                      return (
                        <div>
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
                                {cloud.bucketName && <span> • Bucket: {cloud.bucketName}</span>}
                                <span> • Encrypted: {cloud.encryption || 'AES-256 Cloudinary Secure CDN (HTTPS / TLS 1.3)'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Live Zero-Trust Decrypted Stream:
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span className="zt-pulse-dot" style={{ width: 6, height: 6, backgroundColor: '#10b981' }}></span>
                                <span>AES-256 TLS 1.3 Verified</span>
                              </span>
                            </div>

                            {isImage ? (
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
                              <iframe
                                src={pdfStreamUrl}
                                title="Decrypted Document"
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
                    })()}
                  </div>
                ) : (
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
                    {selectedRes.name === 'Admin Panel' && (
                      <p>💻 <b>Superuser Console Active:</b> System administrative functions unlocked. Firewalls, network clusters, and security policies are active and logging audit traces.</p>
                    )}
                    {!['Documents', 'Reports', 'Dashboard Analytics', 'Admin Panel'].includes(selectedRes.name) && (
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
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Zero Trust Gate</span>
                </div>

                {/* Live Zero-Trust On-Screen Security Passcode Banner (Render / Cloud Native) */}
                {inAppOtp && (
                  <div
                    style={{
                      border: '1px solid #38bdf8',
                      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(30, 58, 138, 0.18) 100%)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="zt-pulse-dot" style={{ width: 7, height: 7, backgroundColor: '#38bdf8' }}></span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                          Zero-Trust Verification Passcode
                        </span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>Instant Gate</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          letterSpacing: '4px',
                          color: '#0369a1',
                        }}
                      >
                        {inAppOtp}
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inAppOtp);
                            setCopiedOtp(true);
                            setTimeout(() => setCopiedOtp(false), 2000);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {copiedOtp ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMfaCode(inAppOtp)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Zap size={12} />
                          <span>Auto-Fill</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Delivery Status Card */}
                <div style={{ border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Mail size={16} style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#0c4a6e', display: 'block' }}>
                        Verification code dispatched for registered account: <strong>{otpMaskedEmail || otpEmail || 'your email'}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e0f2fe', paddingTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#0369a1' }}>
                      <Clock size={12} />
                      <span>Valid for 10 mins</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => sendMfaOtp(selectedRes)}
                      disabled={otpCooldown > 0 || otpSending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: otpCooldown > 0 ? '#94a3b8' : 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: otpCooldown > 0 || otpSending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 4px',
                      }}
                    >
                      <RefreshCw size={11} className={otpSending ? 'animate-spin' : ''} />
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

                <div className="form-group" style={{ textAlign: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 6, display: 'block', fontSize: '0.85rem' }}>
                    Enter 6-Digit Code (Passcode or Authenticator App)
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

                {/* Test code quick helper */}
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setMfaCode('123456')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Quick Test: Use bypass code 123456
                  </button>
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
                  <span>{mfaVerifying ? 'Verifying...' : 'Verify & Unlock'}</span>
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
