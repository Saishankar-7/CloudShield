import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
import { Activity, AlertTriangle, CheckCircle, Terminal, ClipboardEdit, Eye } from 'lucide-react';

const RiskMonitor = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Modal States
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [status, setStatus] = useState('Resolved');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await apiFetch('/risk/alerts');
      setAlerts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alerts:', err.message);
      setLoading(false);
    }
  };

  const handleActionClick = (alertItem, selectStatus = 'Resolved') => {
    setSelectedAlert(alertItem);
    setStatus(selectStatus);
    setNotes(alertItem.resolutionNotes || '');
    setError('');
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiFetch(`/risk/alerts/${selectedAlert._id}`, {
        method: 'PUT',
        body: {
          status,
          resolutionNotes: notes,
        },
      });

      setSelectedAlert(null);
      setNotes('');
      fetchAlerts();
    } catch (err) {
      setError(err.message || 'Failed to submit resolution.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading threat monitor dashboard...
      </div>
    );
  }

  const headers = [
    'Triggered On',
    'Incident Alert Title',
    'Type Classification',
    'Employee Account',
    'Asset Involved',
    'Risk Score',
    'Alert Status',
    'Investigation Actions'
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Continuous Threat & Risk Monitoring</h1>
        </div>
        <p className="page-subtitle">Inspect anomalous authentication logs, lockouts, and policy bypass warnings</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            <span>Threat Security Alerts ({alerts.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={alerts}
            renderRow={(alert) => (
              <tr key={alert._id}>
                <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                    <span>{alert.title}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 500, fontFamily: 'monospace', textTransform: 'capitalize' }}>
                  {alert.type.replace('_', ' ')}
                </td>
                <td style={{ fontWeight: 600 }}>{alert.user ? alert.user.fullName : 'Unknown User'}</td>
                <td style={{ fontWeight: 600 }}>
                  {alert.resource ? alert.resource.name : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>{alert.riskScore ?? 60}</span>
                    <RiskBadge level={alert.riskLevel} />
                  </div>
                </td>
                <td>
                  <StatusBadge status={alert.status} />
                </td>
                <td>
                  {alert.status === 'Open' || alert.status === 'Investigating' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleActionClick(alert, 'Investigating')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() => handleActionClick(alert, 'Resolved')}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleActionClick(alert, alert.status)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={12} />
                      <span>View Details</span>
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Modal: Alert Investigation & Resolution Form */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.1rem' }}>
                {status === 'Resolved' || status === 'Dismissed' ? 'Resolve Security Alert' : 'Investigate Threat Activity'}
              </h2>
              <button className="navbar-btn" onClick={() => setSelectedAlert(null)}>✕</button>
            </div>
            <form onSubmit={submitResolution}>
              <div className="modal-body">
                {error && (
                  <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: 16, fontSize: '0.8rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 16, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Incident Description</span>
                  {selectedAlert.description}
                  <div style={{ marginTop: 8 }}>
                    IP: <b>{selectedAlert.ipAddress}</b> | Location: <b>{selectedAlert.location}</b>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="alertStatus">Set Alert Status</label>
                  <select
                    className="form-input"
                    id="alertStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Investigating">Investigating (Active Review)</option>
                    <option value="Resolved">Resolved (Threat Remediated)</option>
                    <option value="Dismissed">Dismissed (False Positive)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="resolutionNotes">Resolution / Investigation Summary</label>
                  <textarea
                    className="form-input"
                    id="resolutionNotes"
                    rows="3"
                    placeholder="Enter security assessment details, actions taken, or bypass reasons..."
                    style={{ resize: 'none' }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required={status === 'Resolved' || status === 'Dismissed'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedAlert(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMonitor;
