import { useState, useEffect } from 'react';
import { apiFetch, apiUpload } from '../../services/api';
import DataTable from '../../components/DataTable';
import RiskBadge from '../../components/RiskBadge';
import {
  FolderLock,
  Plus,
  Trash2,
  ShieldCheck,
  X,
  FileText,
  Cloud,
  CloudUpload,
  HardDrive,
  Link,
  Eye,
  CheckCircle2,
  ExternalLink,
  Lock,
  Shield,
  UploadCloud
} from 'lucide-react';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCloudAsset, setViewingCloudAsset] = useState(null);

  // New Resource State
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState('Document');
  const [category, setCategory] = useState('Business');
  const [owner, setOwner] = useState('');
  const [sensitivity, setSensitivity] = useState('Low');
  const [status, setStatus] = useState('Protected');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Cloud Storage / PDF State
  const [isCloudPdf, setIsCloudPdf] = useState(false);
  const [cloudProvider, setCloudProvider] = useState('AWS S3');
  const [cloudInputMode, setCloudInputMode] = useState('upload'); // 'upload' | 'uri'
  const [cloudBucket, setCloudBucket] = useState('cloudshield-enterprise-vault');
  const [cloudFileName, setCloudFileName] = useState('');
  const [cloudFileUrl, setCloudFileUrl] = useState('');
  const [cloudFileSize, setCloudFileSize] = useState('');
  const [cloudEncryption, setCloudEncryption] = useState('AES-256 Server-Side Encryption (KMS)');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

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

  // Upload PDF / Document from laptop directly to backend Cloud Storage Vault
  const handleLaptopFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploadingFile(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', cloudProvider);
      formData.append('bucketName', cloudBucket || 'cloudshield-enterprise-vault');

      const resData = await apiUpload('/resources/upload', formData);
      const uploaded = resData.file;

      setCloudFileName(uploaded.fileName);
      setCloudFileSize(uploaded.fileSize);
      setCloudFileUrl(uploaded.fileUrl);
      setUploadedBase64(uploaded.fileUrl);
      setCloudBucket(uploaded.bucketName);
      setCloudEncryption(uploaded.encryption);
      setUploadSuccess(true);

      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setIdentifier(uploaded.cloudUri || `/uploads/${uploaded.storedName}`);
      setType(uploaded.isCloudPdf ? 'PDF Document' : 'Document');
      setIsCloudPdf(true);
    } catch (err) {
      console.error('File upload error:', err.message);
      setError(err.message || 'Failed to upload document to cloud storage.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Apply quick cloud template
  const applyProviderTemplate = (prov) => {
    setCloudProvider(prov);
    const docName = cloudFileName || 'enterprise_security_directive.pdf';
    if (prov === 'Cloudinary Cloud') {
      setCloudBucket('cloudinary-documents-vault');
      setCloudFileUrl(`https://res.cloudinary.com/cloudshield/raw/upload/${docName}`);
      if (!identifier) setIdentifier(`cloudinary://cloudshield_docs/${docName}`);
    } else if (prov === 'AWS S3') {
      setCloudBucket('cloudshield-secure-s3-vault');
      setCloudFileUrl(`s3://cloudshield-secure-s3-vault/policies/${docName}`);
      if (!identifier) setIdentifier(`s3://cloudshield-secure-s3-vault/policies/${docName}`);
    } else if (prov === 'Google Cloud Storage') {
      setCloudBucket('gcs-cloudshield-storage');
      setCloudFileUrl(`gs://gcs-cloudshield-storage/compliance/${docName}`);
      if (!identifier) setIdentifier(`gs://gcs-cloudshield-storage/compliance/${docName}`);
    } else if (prov === 'Azure Blob Storage') {
      setCloudBucket('azure-cloudshield-container');
      setCloudFileUrl(`https://cloudshieldstorage.blob.core.windows.net/secure-docs/${docName}`);
      if (!identifier) setIdentifier(`https://cloudshieldstorage.blob.core.windows.net/secure-docs/${docName}`);
    } else {
      setCloudBucket('cloudshield-cdn-endpoint');
      setCloudFileUrl(`https://cdn.cloudshield.internal/vault/${docName}`);
      if (!identifier) setIdentifier(`https://cdn.cloudshield.internal/vault/${docName}`);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setError('');

    const cloudStoragePayload = isCloudPdf
      ? {
          isCloudPdf: true,
          provider: cloudProvider,
          bucketName: cloudBucket || 'cloudshield-secure-vault',
          fileName: cloudFileName || `${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileUrl: cloudFileUrl || `s3://cloudshield-vault/docs/${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSize: cloudFileSize || '2.4 MB',
          fileType: 'application/pdf',
          encryption: cloudEncryption,
        }
      : { isCloudPdf: false };

    try {
      await apiFetch('/resources', {
        method: 'POST',
        body: {
          name,
          identifier,
          type: isCloudPdf ? 'PDF Document' : type,
          category,
          owner,
          sensitivity,
          status,
          description,
          cloudStorage: cloudStoragePayload,
        },
      });

      setShowAddModal(false);
      // Reset form fields
      setName('');
      setIdentifier('');
      setOwner('');
      setDescription('');
      setIsCloudPdf(false);
      setCloudFileName('');
      setCloudFileUrl('');
      setCloudFileSize('');
      setCloudBucket('cloudshield-enterprise-vault');
      setUploadedBase64('');
      setUploadSuccess(false);
      fetchResources();
    } catch (err) {
      setError(err.message || 'Failed to create resource.');
    }
  };

  const handleDeleteResource = async (resId) => {
    if (!window.confirm('Are you sure you want to remove this resource from secure catalog?')) {
      return;
    }

    try {
      await apiFetch(`/resources/${resId}`, {
        method: 'DELETE',
      });
      fetchResources();
    } catch (err) {
      alert(err.message || 'Failed to delete resource.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading catalog resources...
      </div>
    );
  }

  const headers = [
    'Resource Name',
    'Identifier URL/Path',
    'Type & Cloud Provider',
    'Category Group',
    'Owner Department',
    'Sensitivity',
    'Default Policy Status',
    'Actions'
  ];

  return (
    <div className="content-body">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Enterprise Security Catalog</h1>
          <p className="page-subtitle">Configure cloud resources, endpoints, and register secure Cloud Storage PDF documents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ gap: 8, display: 'flex', alignItems: 'center' }}
        >
          <Plus size={16} />
          <span>Add Resource Catalog</span>
        </button>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderLock size={20} style={{ color: 'var(--primary)' }} />
            <span>Secure Catalog Assets ({resources.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={resources}
            renderRow={(res) => (
              <tr key={res._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {res.cloudStorage?.isCloudPdf ? (
                      <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: 6, borderRadius: 'var(--radius-sm)' }}>
                        <FileText size={16} />
                      </div>
                    ) : (
                      <div style={{ color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 6, borderRadius: 'var(--radius-sm)' }}>
                        <FolderLock size={16} />
                      </div>
                    )}
                    <span style={{ fontWeight: 700 }}>{res.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {res.identifier}
                </td>
                <td>
                  {res.cloudStorage?.isCloudPdf ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content', fontSize: '0.725rem' }}>
                        <Cloud size={12} />
                        <span>{res.cloudStorage.provider || 'Cloud PDF'}</span>
                      </span>
                      {res.cloudStorage.fileName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {res.cloudStorage.fileName} ({res.cloudStorage.fileSize || 'PDF'})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>{res.type}</span>
                  )}
                </td>
                <td>{res.category}</td>
                <td style={{ fontWeight: 500 }}>{res.owner}</td>
                <td>
                  <RiskBadge level={res.sensitivity} />
                </td>
                <td>
                  <span className={`badge ${res.status === 'Restricted' ? 'badge-danger' : 'badge-success'}`}>
                    {res.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {res.cloudStorage?.isCloudPdf && (
                      <button
                        onClick={() => setViewingCloudAsset(res)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                        title="View Cloud PDF Details"
                      >
                        <Eye size={13} />
                        <span>Cloud PDF</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteResource(res._id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '6px', borderRadius: '4px' }}
                      title="Delete Resource"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Modal: Add Resource */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Register Secure Resource</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure endpoints, servers, or attach Cloud Storage PDF documents</p>
              </div>
              <button className="navbar-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddResource}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {error && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="name">Resource Title *</label>
                  <input
                    className="form-input"
                    type="text"
                    id="name"
                    placeholder="e.g. 2026 Security Compliance Policy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Cloud Storage PDF Toggle Box */}
                <div
                  style={{
                    backgroundColor: isCloudPdf ? 'rgba(59, 130, 246, 0.06)' : '#f8fafc',
                    border: `1.5px solid ${isCloudPdf ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    marginBottom: 18,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isCloudPdf}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsCloudPdf(checked);
                        if (checked) {
                          setType('PDF Document');
                          if (!cloudBucket) applyProviderTemplate('AWS S3');
                        } else {
                          setType('Document');
                        }
                      }}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                        <Cloud size={16} style={{ color: 'var(--primary)' }} />
                        <span>Cloud Storage PDF Asset</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        Store and protect PDF documents located on AWS S3, Google Cloud Storage, or Azure Blob Storage
                      </span>
                    </div>
                  </label>

                  {/* Cloud PDF Configuration fields */}
                  {isCloudPdf && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border-color)' }}>
                      {/* Provider Selectors */}
                      <div className="form-group">
                        <label className="form-label">Cloud Storage Provider</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                          {[
                            { name: 'Cloudinary Cloud', icon: '☁️', color: '#3b82f6' },
                            { name: 'AWS S3', icon: '📦', color: '#ff9900' },
                            { name: 'Google Cloud Storage', icon: '🌐', color: '#4285f4' },
                            { name: 'Azure Blob Storage', icon: '🔷', color: '#0089d6' },
                            { name: 'Direct Cloud URL', icon: '🔗', color: '#6366f1' },
                          ].map((prov) => (
                            <button
                              key={prov.name}
                              type="button"
                              onClick={() => applyProviderTemplate(prov.name)}
                              style={{
                                padding: '8px 6px',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${cloudProvider === prov.name ? 'var(--primary)' : 'var(--border-color)'}`,
                                backgroundColor: cloudProvider === prov.name ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--text-primary)',
                              }}
                            >
                              <span>{prov.icon}</span>
                              <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{prov.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mode Switcher */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={() => setCloudInputMode('uri')}
                          className={`btn btn-sm ${cloudInputMode === 'uri' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                        >
                          <Link size={13} />
                          <span>Cloud Storage URI / URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCloudInputMode('upload')}
                          className={`btn btn-sm ${cloudInputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                        >
                          <CloudUpload size={13} />
                          <span>Upload PDF Document</span>
                        </button>
                      </div>

                      {cloudInputMode === 'upload' ? (
                        <div className="form-group">
                          <label className="form-label">Select Document from Laptop</label>
                          <div
                            style={{
                              border: `2px dashed ${uploadSuccess ? '#10b981' : '#cbd5e1'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '22px 16px',
                              textAlign: 'center',
                              backgroundColor: uploadSuccess ? 'rgba(16, 185, 129, 0.04)' : '#ffffff',
                              cursor: uploadingFile ? 'wait' : 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => !uploadingFile && document.getElementById('pdf-file-input').click()}
                          >
                            <input
                              id="pdf-file-input"
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
                              style={{ display: 'none' }}
                              onChange={handleLaptopFileUpload}
                              disabled={uploadingFile}
                            />
                            {uploadingFile ? (
                              <div>
                                <CloudUpload size={36} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 8px auto', display: 'block' }} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Uploading to Cloud Storage Vault...</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.725rem', color: 'var(--text-muted)' }}>Encrypting with AES-256 and generating secure S3 URI</p>
                              </div>
                            ) : uploadSuccess ? (
                              <div>
                                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 8px auto', display: 'block' }} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#065f46' }}>Uploaded Successfully to Cloud!</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  <strong>{cloudFileName}</strong> ({cloudFileSize}) • {cloudProvider}
                                </p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'underline', marginTop: 6, display: 'inline-block' }}>
                                  Click to replace with another file
                                </span>
                              </div>
                            ) : (
                              <div>
                                <UploadCloud size={36} style={{ color: 'var(--primary)', margin: '0 auto 8px auto', display: 'block' }} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Click or drop document from your laptop</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                  Supported formats: PDF, Word, Excel, Text (Stored in Cloud Vault)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="form-group">
                            <label className="form-label">Cloud Storage Path / URI (S3 / GCS / Azure)</label>
                            <input
                              className="form-input"
                              type="text"
                              placeholder="e.g. s3://cloudshield-vault/policies/security_directive.pdf"
                              value={cloudFileUrl}
                              onChange={(e) => {
                                setCloudFileUrl(e.target.value);
                                if (!identifier) setIdentifier(e.target.value);
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                              <label className="form-label">Bucket / Container</label>
                              <input
                                className="form-input"
                                type="text"
                                placeholder="e.g. cloudshield-secure-vault"
                                value={cloudBucket}
                                onChange={(e) => setCloudBucket(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">PDF File Name</label>
                              <input
                                className="form-input"
                                type="text"
                                placeholder="e.g. Q3_Audit_Report.pdf"
                                value={cloudFileName}
                                onChange={(e) => setCloudFileName(e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label">Estimated File Size</label>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. 3.4 MB"
                            value={cloudFileSize}
                            onChange={(e) => setCloudFileSize(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Cloud Encryption Protocol</label>
                          <select
                            className="form-input"
                            value={cloudEncryption}
                            onChange={(e) => setCloudEncryption(e.target.value)}
                          >
                            <option value="AES-256 Server-Side Encryption (KMS)">AES-256 Server-Side (KMS)</option>
                            <option value="Client-Side Zero-Knowledge Encrypted">Client-Side Zero-Knowledge</option>
                            <option value="Cloud HSM Hardware Encryption">Cloud HSM Hardware</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ident">Identifier (Endpoint PATH / S3 URI) *</label>
                  <input
                    className="form-input"
                    type="text"
                    id="ident"
                    placeholder="e.g. /api/resources/docs or s3://company-financials/report.pdf"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="typeSelect">Resource Type</label>
                    <select
                      className="form-input"
                      id="typeSelect"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="Document">Document</option>
                      <option value="PDF Document">PDF Document (Cloud)</option>
                      <option value="Database">Database</option>
                      <option value="Application">Application</option>
                      <option value="API">API Endpoint</option>
                      <option value="Storage">Cloud Storage Bucket</option>
                      <option value="Service">Microservice</option>
                      <option value="System">System Console</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="catSelect">Category Group</label>
                    <select
                      className="form-input"
                      id="catSelect"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Business">Business Operations</option>
                      <option value="HR">Human Resources</option>
                      <option value="Analytics">Data Analytics</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Projects">Projects</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ownerInput">Owner Department / Team *</label>
                  <input
                    className="form-input"
                    type="text"
                    id="ownerInput"
                    placeholder="e.g. IT Security Office"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sens">Sensitivity Level</label>
                    <select
                      className="form-input"
                      id="sens"
                      value={sensitivity}
                      onChange={(e) => setSensitivity(e.target.value)}
                    >
                      <option value="Low">Low Sensitivity</option>
                      <option value="Medium">Medium Sensitivity</option>
                      <option value="High">High Sensitivity</option>
                      <option value="Critical">Critical Sensitivity</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="stat">Policy Status</label>
                    <select
                      className="form-input"
                      id="stat"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Protected">Protected (Role restricted)</option>
                      <option value="Restricted">Restricted (High security gate)</option>
                      <option value="Public">Public (Free access)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="desc">Asset Description</label>
                  <textarea
                    className="form-input"
                    id="desc"
                    rows="2"
                    placeholder="Explain what information this asset holds..."
                    style={{ resize: 'none' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
                  <ShieldCheck size={14} />
                  <span>Register Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Cloud Storage PDF Metadata */}
      {viewingCloudAsset && (
        <div className="modal-overlay" onClick={() => setViewingCloudAsset(null)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: 8, borderRadius: 'var(--radius-sm)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{viewingCloudAsset.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cloud Storage PDF Metadata & Zero Trust Gate</p>
                </div>
              </div>
              <button className="navbar-btn" onClick={() => setViewingCloudAsset(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Storage Provider</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Cloud size={14} style={{ color: 'var(--primary)' }} />
                      <span>{viewingCloudAsset.cloudStorage?.provider || 'AWS S3'}</span>
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Bucket / Container</span>
                    <strong>{viewingCloudAsset.cloudStorage?.bucketName || 'cloudshield-vault'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>File Name</span>
                    <strong>{viewingCloudAsset.cloudStorage?.fileName || viewingCloudAsset.name + '.pdf'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>File Size</span>
                    <strong>{viewingCloudAsset.cloudStorage?.fileSize || '2.4 MB'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Storage URI</span>
                    <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', marginTop: 4 }}>
                      {viewingCloudAsset.cloudStorage?.fileUrl?.startsWith('data:') ? 'Embedded Cloud PDF Stream (base64)' : viewingCloudAsset.cloudStorage?.fileUrl || viewingCloudAsset.identifier}
                    </code>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Encryption</span>
                    <span style={{ color: 'var(--success-text, #059669)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Lock size={12} />
                      <span>{viewingCloudAsset.cloudStorage?.encryption || 'AES-256 Server-Side Encryption'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {viewingCloudAsset.cloudStorage?.fileUrl && (
                <div>
                  {viewingCloudAsset.cloudStorage.fileUrl.endsWith('.pdf') || viewingCloudAsset.cloudStorage.fileType === 'application/pdf' ? (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Live Document Stream Preview
                      </span>
                      <iframe
                        src={viewingCloudAsset.cloudStorage.fileUrl}
                        title="Document Preview"
                        style={{
                          width: '100%',
                          height: '240px',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f1f5f9',
                        }}
                      />
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <a
                      href={viewingCloudAsset.cloudStorage.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 18px' }}
                    >
                      <ExternalLink size={14} />
                      <span>Open Document in New Tab</span>
                    </a>
                    <a
                      href={viewingCloudAsset.cloudStorage.fileUrl}
                      download={viewingCloudAsset.cloudStorage.fileName || 'document.pdf'}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 18px' }}
                    >
                      <HardDrive size={14} />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingCloudAsset(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;

