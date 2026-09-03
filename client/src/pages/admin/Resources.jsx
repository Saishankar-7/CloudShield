import { useState, useEffect } from 'react';
import { apiFetch, apiUpload, API_URL } from '../../services/api';
import DataTable from '../../components/DataTable';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
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

  // Admin Access Control & Permission Management State
  const [managingAccessRes, setManagingAccessRes] = useState(null);
  const [accessDepts, setAccessDepts] = useState(['All']);
  const [accessRoles, setAccessRoles] = useState(['admin', 'employee', 'manager']);
  const [accessAllowedUsers, setAccessAllowedUsers] = useState([]);
  const [accessUserSearch, setAccessUserSearch] = useState('');
  const [allUsersList, setAllUsersList] = useState([]);
  const [accessMfa, setAccessMfa] = useState('Always Required');
  const [accessDownload, setAccessDownload] = useState(true);
  const [accessStatus, setAccessStatus] = useState('Active');
  const [accessSensitivity, setAccessSensitivity] = useState('Low');
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessSuccess, setAccessSuccess] = useState('');
  const [accessError, setAccessError] = useState('');

  const ALL_DEPARTMENTS = ['All', 'Engineering', 'Security', 'Finance', 'HR', 'Operations', 'Sales', 'Executive', 'Legal'];
  const ALL_ROLES = [
    { id: 'admin', label: 'Administrator' },
    { id: 'employee', label: 'Employee' },
    { id: 'manager', label: 'Manager' },
  ];

  const handleOpenAccessModal = (res) => {
    setManagingAccessRes(res);
    setAccessDepts(res.allowedDepartments && res.allowedDepartments.length > 0 ? res.allowedDepartments : ['All']);
    setAccessRoles(res.allowedRoles && res.allowedRoles.length > 0 ? res.allowedRoles : ['admin', 'employee', 'manager']);
    setAccessAllowedUsers(res.allowedUsers ? res.allowedUsers.map((u) => (u._id || u).toString()) : []);
    setAccessUserSearch('');
    setAccessMfa(res.mfaRequirement || 'Always Required');
    setAccessDownload(res.downloadAllowed !== undefined ? res.downloadAllowed : true);
    setAccessStatus(res.accessStatus || 'Active');
    setAccessSensitivity(res.sensitivity || 'Low');
    setAccessSuccess('');
    setAccessError('');
  };

  const handleToggleDept = (dept) => {
    if (dept === 'All') {
      setAccessDepts(['All']);
      return;
    }
    if (dept === 'None') {
      setAccessDepts([]);
      return;
    }
    let newDepts = accessDepts.filter((d) => d !== 'All' && d !== 'None');
    if (newDepts.includes(dept)) {
      newDepts = newDepts.filter((d) => d !== dept);
    } else {
      newDepts.push(dept);
    }
    setAccessDepts(newDepts);
  };

  const handleToggleRole = (role) => {
    if (accessRoles.includes(role)) {
      if (accessRoles.length > 1) {
        setAccessRoles(accessRoles.filter((r) => r !== role));
      }
    } else {
      setAccessRoles([...accessRoles, role]);
    }
  };

  const handleToggleAllowedUser = (userId) => {
    const idStr = userId.toString();
    if (accessAllowedUsers.includes(idStr)) {
      setAccessAllowedUsers(accessAllowedUsers.filter((id) => id !== idStr));
    } else {
      setAccessAllowedUsers([...accessAllowedUsers, idStr]);
    }
  };

  const handleSaveAccess = async (e) => {
    e.preventDefault();
    if (!managingAccessRes) return;
    setAccessSaving(true);
    setAccessError('');
    setAccessSuccess('');

    try {
      const data = await apiFetch(`/resources/${managingAccessRes._id}/access`, {
        method: 'PUT',
        body: {
          allowedDepartments: accessDepts,
          allowedRoles: accessRoles,
          allowedUsers: accessAllowedUsers,
          mfaRequirement: accessMfa,
          downloadAllowed: accessDownload,
          accessStatus: accessStatus,
          sensitivity: accessSensitivity,
          status: accessStatus === 'Active' ? 'Protected' : 'Restricted',
        },
      });

      setAccessSuccess(data.message || 'Resource access rules updated successfully.');
      fetchResources();
      setTimeout(() => {
        setManagingAccessRes(null);
        setAccessSuccess('');
      }, 1000);
    } catch (err) {
      setAccessError(err.message || 'Failed to update access rules.');
    } finally {
      setAccessSaving(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/users');
      if (Array.isArray(data)) setAllUsersList(data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchUsers();
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
    if (!window.confirm('Are you sure you want to delete this resource? Any associated cloud documents stored in Cloudinary will also be permanently deleted.')) {
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
    'Owner Dept',
    'Allowed Depts',
    'Sensitivity',
    'MFA Policy',
    'Access Status',
    'Actions'
  ];

  return (
    <div className="content-body">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandLogo size={26} glow={true} />
            <h1 className="page-title">Enterprise Security Catalog</h1>
          </div>
          <p className="page-subtitle">Configure cloud resources, endpoints, access control policies, and MFA gates</p>
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
            <span>Secure Catalog Assets & Access Control ({resources.length})</span>
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
                      <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', padding: 6, borderRadius: 'var(--radius-sm)' }}>
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
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <td style={{ fontWeight: 500 }}>{res.owner}</td>
                <td>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {res.allowedDepartments?.length > 0
                      ? res.allowedDepartments.includes('All')
                        ? 'All Depts'
                        : `${res.allowedDepartments.length} Depts`
                      : 'All Depts'}
                  </span>
                </td>
                <td>
                  <RiskBadge level={res.sensitivity} />
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      backgroundColor: res.mfaRequirement === 'Disabled' ? '#f1f5f9' : '#eff6ff',
                      color: res.mfaRequirement === 'Disabled' ? '#64748b' : '#2563eb',
                      border: res.mfaRequirement === 'Disabled' ? '1px solid #cbd5e1' : '1px solid #bfdbfe',
                    }}
                  >
                    {res.mfaRequirement || 'Always Required'}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      res.accessStatus === 'Revoked'
                        ? 'badge-danger'
                        : res.accessStatus === 'Restricted'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                  >
                    {res.accessStatus || 'Active'}
                  </span>
                </td>
                <td>
                  <div className="action-btn-group">
                    <button
                      onClick={() => handleOpenAccessModal(res)}
                      className="action-btn action-btn-primary"
                      title="Manage Access Control & Permissions"
                    >
                      <Shield size={13} />
                      <span>Manage Access</span>
                    </button>
                    {res.cloudStorage?.isCloudPdf && (
                      <button
                        onClick={() => setViewingCloudAsset(res)}
                        className="action-btn action-btn-secondary"
                        title="View Cloud PDF Details"
                      >
                        <Eye size={13} />
                        <span>View PDF</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteResource(res._id)}
                      className="action-btn action-btn-danger action-btn-icon"
                      title="Delete Resource"
                    >
                      <Trash2 size={13} />
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
                                backgroundColor: cloudProvider === prov.name ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                color: cloudProvider === prov.name ? 'var(--primary)' : 'var(--text-primary)',
                                transition: 'all 0.15s ease',
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
                              border: `2px dashed ${uploadSuccess ? 'var(--success)' : 'var(--border-input)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '22px 16px',
                              textAlign: 'center',
                              backgroundColor: uploadSuccess ? 'var(--success-bg)' : 'var(--bg-card-subtle)',
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
                <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: 8, borderRadius: 'var(--radius-sm)' }}>
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
              <div style={{ backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Storage Provider</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: 'var(--text-primary)' }}>
                      <Cloud size={14} style={{ color: 'var(--primary)' }} />
                      <span>{viewingCloudAsset.cloudStorage?.provider || 'AWS S3'}</span>
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Bucket / Container</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{viewingCloudAsset.cloudStorage?.bucketName || 'cloudshield-vault'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>File Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{viewingCloudAsset.cloudStorage?.fileName || viewingCloudAsset.name + '.pdf'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>File Size</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{viewingCloudAsset.cloudStorage?.fileSize || '2.4 MB'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Storage URI</span>
                    <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px', marginTop: 4 }}>
                      {viewingCloudAsset.cloudStorage?.fileUrl?.startsWith('data:') ? 'Embedded Cloud PDF Stream (base64)' : viewingCloudAsset.cloudStorage?.fileUrl || viewingCloudAsset.identifier}
                    </code>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Encryption</span>
                    <span style={{ color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Lock size={12} />
                      <span>{viewingCloudAsset.cloudStorage?.encryption || 'AES-256 Server-Side Encryption'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {(() => {
                const token = localStorage.getItem('token');
                const streamUrl = `${API_URL}/resources/${viewingCloudAsset._id}/stream?token=${token}`;
                const downloadUrl = `${API_URL}/resources/${viewingCloudAsset._id}/stream?token=${token}&download=true`;

                return (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Live Document Stream Preview
                      </span>
                      <iframe
                        src={streamUrl}
                        title="Document Preview"
                        style={{
                          width: '100%',
                          height: '240px',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card-subtle)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <a
                        href={streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 18px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Document in New Tab</span>
                      </a>
                      <a
                        href={downloadUrl}
                        download={viewingCloudAsset.cloudStorage?.fileName || 'document.pdf'}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 18px', textDecoration: 'none' }}
                      >
                        <HardDrive size={14} />
                        <span>Download File</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingCloudAsset(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Resource Access & Permissions */}
      {managingAccessRes && (
        <div className="modal-overlay" onClick={() => setManagingAccessRes(null)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                    Manage Access: {managingAccessRes.name}
                  </h2>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Category: <b>{managingAccessRes.category}</b> • Type: <b>{managingAccessRes.type}</b> • Owner: <b>{managingAccessRes.owner}</b>
                </p>
              </div>
              <button className="navbar-btn" onClick={() => setManagingAccessRes(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccess}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {accessError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {accessError}
                  </div>
                )}

                {accessSuccess && (
                  <div style={{ color: '#065f46', backgroundColor: '#d1fae5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {accessSuccess}
                  </div>
                )}

                {/* Access Status Section */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Resource Access Status
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { id: 'Active', label: 'Active', desc: 'Available to permitted users', color: 'var(--success-text)', bg: 'var(--success-bg)', border: 'var(--success)' },
                      { id: 'Restricted', label: 'Restricted', desc: 'Requires step-up approval', color: 'var(--warning-text)', bg: 'var(--warning-bg)', border: 'var(--warning)' },
                      { id: 'Revoked', label: 'Revoked', desc: 'Access blocked for all users', color: 'var(--danger-text)', bg: 'var(--danger-bg)', border: 'var(--danger)' },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setAccessStatus(item.id)}
                        style={{
                          border: accessStatus === item.id ? `2px solid ${item.border}` : '1px solid var(--border-color)',
                          backgroundColor: accessStatus === item.id ? item.bg : 'var(--bg-card-subtle)',
                          borderRadius: '8px',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: accessStatus === item.id ? item.color : 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MFA Policy Section */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Multi-Factor Authentication (MFA) Requirement
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { id: 'Always Required', label: 'Always Required', desc: 'Send 6-digit Email OTP on every access' },
                      { id: 'Risk-Based', label: 'Risk-Based', desc: 'Prompt OTP only if risk score > 30' },
                      { id: 'Disabled', label: 'Disabled', desc: 'Direct access without OTP prompt' },
                    ].map((mfa) => (
                      <div
                        key={mfa.id}
                        onClick={() => setAccessMfa(mfa.id)}
                        style={{
                          border: accessMfa === mfa.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: accessMfa === mfa.id ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                          borderRadius: '8px',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.825rem', color: accessMfa === mfa.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {mfa.label}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>{mfa.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allowed Departments (Pills) */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                      Allowed Departments
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setAccessDepts(['All'])}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 8px' }}
                      >
                        Allow All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccessDepts([]);
                          setAccessStatus('Restricted');
                        }}
                        className="btn btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 8px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border, #ef4444)' }}
                      >
                        🚫 Disable All (Force Request)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleDept('None')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: accessDepts.length === 0 ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                        backgroundColor: accessDepts.length === 0 ? '#ef4444' : 'var(--bg-card-subtle)',
                        color: accessDepts.length === 0 ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      🚫 None (Disabled for All) {accessDepts.length === 0 && '✓'}
                    </button>

                    {ALL_DEPARTMENTS.map((dept) => {
                      const isSelected = accessDepts.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleToggleDept(dept)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-card-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {dept} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  {accessDepts.length === 0 ? (
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border, #f59e0b)', borderRadius: '6px', fontSize: '0.725rem', color: 'var(--warning-text, #d97706)' }}>
                      🔒 <b>Zero-Trust Gate:</b> No department is granted direct access. Users must click <b>"Request Access"</b> to request administrative approval before accessing this resource.
                    </div>
                  ) : accessDepts.includes('All') ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      ✓ All corporate departments are permitted direct access under zero-trust policy.
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Only employees in <b>{accessDepts.join(', ')}</b> are permitted direct access. Others must request access.
                    </div>
                  )}
                </div>

                {/* Allowed Specific User Accounts (Granular Per-User Control) */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                      Allowed Specific User Accounts ({accessAllowedUsers.length} Selected)
                    </label>
                    {accessAllowedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAccessAllowedUsers([])}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 8px' }}
                      >
                        Clear Specific Users (Allow All in Dept)
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      placeholder="Search users by name, email or department..."
                      value={accessUserSearch}
                      onChange={(e) => setAccessUserSearch(e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {allUsersList
                      .filter((u) => {
                        if (!accessUserSearch) return true;
                        const q = accessUserSearch.toLowerCase();
                        return (
                          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.department && u.department.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const uid = (u._id || u).toString();
                        const isSelected = accessAllowedUsers.includes(uid);
                        return (
                          <div
                            key={uid}
                            onClick={() => handleToggleAllowedUser(uid)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', display: 'block' }}>
                                {u.fullName} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.725rem' }}>({u.email})</span>
                              </span>
                              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                Dept: <b>{u.department || 'General'}</b> • Role: <b>{u.role}</b>
                              </span>
                            </div>
                            <span
                              className={`badge ${isSelected ? 'badge-primary' : 'badge-secondary'}`}
                              style={{ fontSize: '0.675rem', padding: '3px 8px' }}
                            >
                              {isSelected ? '✓ Allowed' : '+ Grant Access'}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {accessAllowedUsers.length > 0 ? (
                    <div style={{ marginTop: 6, padding: '6px 10px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.725rem', color: 'var(--primary)', fontWeight: 600 }}>
                      🎯 <b>Granular Restriction Active:</b> ONLY the {accessAllowedUsers.length} selected user account(s) will be allowed. All other user accounts will be restricted.
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      👥 No specific user restrictions. Access is governed by the Allowed Departments & Roles below.
                    </div>
                  )}
                </div>

                {/* Allowed Roles (Pills) */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Allowed User Roles
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ALL_ROLES.map((role) => {
                      const isSelected = accessRoles.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {role.label} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sensitivity & Download Permissions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Classification Sensitivity</label>
                    <select
                      className="form-input"
                      value={accessSensitivity}
                      onChange={(e) => setAccessSensitivity(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>File Downloads</label>
                    <select
                      className="form-input"
                      value={accessDownload ? 'true' : 'false'}
                      onChange={(e) => setAccessDownload(e.target.value === 'true')}
                    >
                      <option value="true">Allowed for authorized users</option>
                      <option value="false">Restricted (View-Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setManagingAccessRes(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accessSaving}
                  className="btn btn-primary btn-sm"
                  style={{ minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Shield size={14} />
                  <span>{accessSaving ? 'Saving Rules...' : 'Save Access Rules'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;

