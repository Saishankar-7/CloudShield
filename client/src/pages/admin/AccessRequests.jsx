import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
import { Inbox, ThumbsUp, ThumbsDown } from 'lucide-react';

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [reviewingReq, setReviewingReq] = useState(null);
  const [notes, setNotes] = useState('');
  const [reviewType, setReviewType] = useState(''); // 'Approved' | 'Denied'
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiFetch('/requests/all');
      setRequests(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err.message);
      setLoading(false);
    }
  };

  const handleReviewAction = (reqItem, type) => {
    setReviewingReq(reqItem);
    setReviewType(type);
    setNotes('');
    setActionError('');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setActionError('');

    try {
      await apiFetch(`/requests/${reviewingReq._id}/review`, {
        method: 'PUT',
        body: {
          status: reviewType,
          reviewNotes: notes,
          expiryHours: 24,
        },
      });

      setReviewingReq(null);
      setNotes('');
      fetchRequests();
    } catch (err) {
      setActionError(err.message || 'Failed to submit review decision.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading access requests...
      </div>
    );
  }

  const headers = [
    'Request ID',
    'User Name',
    'Resource Target',
    'Privilege Type',
    'Justification Reason',
    'Risk Score',
    'Decision Status',
    'Submitted On',
    'Reviewed By'
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Access Request Approvals Queue</h1>
        </div>
        <p className="page-subtitle">Review, authorize, or deny employee requests for restricted cloud assets</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Inbox size={20} style={{ color: 'var(--primary)' }} />
            <span>Requests Processing Center ({requests.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={requests}
            renderRow={(req) => (
              <tr key={req._id}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{req.requestId}</td>
                <td style={{ fontWeight: 600 }}>{req.user ? req.user.fullName : 'Unknown User'}</td>
                <td style={{ fontWeight: 700 }}>{req.resource ? req.resource.name : 'Unknown Resource'}</td>
                <td>{req.accessType}</td>
                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                  {req.reason}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{req.riskScore ?? 15}</span>
                    <RiskBadge level={req.riskLevel} />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusBadge status={req.status} />
                    {req.status === 'Pending' && (
                      <div className="action-btn-group" style={{ marginLeft: 6 }}>
                        <button
                          onClick={() => handleReviewAction(req, 'Approved')}
                          className="action-btn action-btn-success"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          title="Approve Request"
                        >
                          <ThumbsUp size={12} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReviewAction(req, 'Denied')}
                          className="action-btn action-btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          title="Deny Request"
                        >
                          <ThumbsDown size={12} />
                          <span>Deny</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(req.requestedOn).toLocaleDateString()} {new Date(req.requestedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ fontSize: '0.8rem' }}>
                  {req.reviewedBy ? 'Admin Reviewed' : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Modal: Request Approval/Denial Notes */}
      {reviewingReq && (
        <div className="modal-overlay" onClick={() => setReviewingReq(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: reviewType === 'Approved' ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
              <h2 style={{ fontSize: '1.1rem', color: reviewType === 'Approved' ? 'var(--success-text)' : 'var(--danger-text)' }}>
                Confirm Access Request {reviewType}
              </h2>
              <button className="navbar-btn" onClick={() => setReviewingReq(null)}>✕</button>
            </div>
            <form onSubmit={submitReview}>
              <div className="modal-body">
                {actionError && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem' }}>
                    {actionError}
                  </div>
                )}

                <div style={{ marginBottom: 16, fontSize: '0.875rem', lineHeight: 1.4 }}>
                  User: <b>{reviewingReq.user?.fullName}</b><br />
                  Resource: <b>{reviewingReq.resource?.name}</b><br />
                  Privilege Requested: <b>{reviewingReq.accessType}</b><br />
                  Reason: <i>"{reviewingReq.reason}"</i>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reviewNotes">Review Notes / Security Audit Comments</label>
                  <textarea
                    className="form-input"
                    id="reviewNotes"
                    rows="3"
                    placeholder="Enter approval details or reason for denying access..."
                    style={{ resize: 'none' }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReviewingReq(null)}>Cancel</button>
                <button
                  type="submit"
                  className={`btn btn-sm ${reviewType === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                >
                  Confirm {reviewType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
