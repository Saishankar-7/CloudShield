import { FileText, Database, ShieldAlert, Cpu, Network, CheckCircle, Lock, AlertTriangle, KeyRound, Cloud } from 'lucide-react';
import RiskBadge from './RiskBadge';

const ResourceCard = ({ resource, onAccess, onRequestAccess }) => {
  const {
    name,
    type,
    category,
    sensitivity,
    description,
    decision, // 'Allow', 'Deny', 'MFA_Required'
    requestStatus, // 'Pending', 'Approved', 'Denied', null
    cloudStorage,
  } = resource;

  const isCloudPdf = cloudStorage?.isCloudPdf || type === 'PDF Document';

  // Icon selector based on resource type
  const getResourceIcon = () => {
    if (isCloudPdf) {
      return <FileText size={22} style={{ color: '#ef4444' }} />;
    }
    switch (type) {
      case 'Database':
        return <Database size={22} />;
      case 'Document':
        return <FileText size={22} />;
      case 'System':
        return <Cpu size={22} />;
      case 'API':
      case 'Service':
        return <Network size={22} />;
      default:
        return <ShieldAlert size={22} />;
    }
  };

  // Determine resource visual state based on zero trust decision
  const getResourceStateBadge = () => {
    if (decision === 'Allow') {
      return (
        <span className="badge badge-success" style={{ gap: 4 }}>
          <CheckCircle size={12} />
          <span>Allowed</span>
        </span>
      );
    }
    
    if (decision === 'MFA_Required') {
      return (
        <span className="badge badge-warning" style={{ gap: 4 }}>
          <KeyRound size={12} />
          <span>MFA Required</span>
        </span>
      );
    }

    // decision === 'Deny'
    if (requestStatus === 'Pending') {
      return (
        <span className="badge badge-info" style={{ gap: 4 }}>
          <AlertTriangle size={12} />
          <span>Pending Review</span>
        </span>
      );
    }

    if (requestStatus === 'Denied') {
      return (
        <span className="badge badge-danger" style={{ gap: 4 }}>
          <Lock size={12} />
          <span>Denied (Admin)</span>
        </span>
      );
    }

    return (
      <span className="badge badge-danger" style={{ gap: 4 }}>
        <Lock size={12} />
        <span>Restricted</span>
      </span>
    );
  };

  // Render appropriate action button
  const renderActionButton = () => {
    if (decision === 'Allow') {
      return (
        <button onClick={() => onAccess(resource)} className="btn btn-access">
          {isCloudPdf ? 'View PDF' : 'Access'}
        </button>
      );
    }

    if (decision === 'MFA_Required') {
      return (
        <button onClick={() => onAccess(resource)} className="btn btn-access" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>
          Verify MFA
        </button>
      );
    }

    // decision === 'Deny'
    if (requestStatus === 'Pending') {
      return (
        <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
          Request Pending
        </button>
      );
    }

    return (
      <button onClick={() => onRequestAccess(resource)} className="btn btn-primary btn-sm">
        Request Access
      </button>
    );
  };

  return (
    <div className="glass-card resource-card">
      <div className="res-header">
        <div className="res-icon" style={{ backgroundColor: isCloudPdf ? '#fee2e2' : undefined }}>
          {getResourceIcon()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <RiskBadge level={sensitivity} />
          {getResourceStateBadge()}
        </div>
      </div>

      <div className="res-body">
        <h3 className="res-name">{name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {category} • {type}
          </span>
          {isCloudPdf && (
            <span className="badge badge-info" style={{ fontSize: '0.675rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Cloud size={10} />
              <span>{cloudStorage?.provider || 'Cloud PDF'}</span>
            </span>
          )}
        </div>
        <p className="res-desc">{description}</p>
        {isCloudPdf && cloudStorage?.fileName && (
          <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={12} style={{ color: '#ef4444' }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cloudStorage.fileName}</span>
            {cloudStorage.fileSize && <span>({cloudStorage.fileSize})</span>}
          </div>
        )}
      </div>

      <div className="res-footer">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Owner: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{resource.owner}</span>
        </span>
        {renderActionButton()}
      </div>
    </div>
  );
};

export default ResourceCard;
