import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
import { Inbox, Calendar } from 'lucide-react';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiFetch('/requests/my');
      setRequests(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err.message);
      setLoading(false);
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
    'Resource',
    'Privilege Type',
    'Reason Justification',
    'Risk Score',
    'Status Decision',
    'Submitted On',
    'Expiration Date'
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Access Request History</h1>
        </div>
        <p className="page-subtitle">Track, monitor, and check approval states of restricted resources</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Inbox size={20} style={{ color: 'var(--primary)' }} />
            <span>My Access Requests ({requests.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={requests}
            renderRow={(req) => (
              <tr key={req._id}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{req.requestId}</td>
                <td style={{ fontWeight: 700 }}>{req.resource ? req.resource.name : 'Unknown Resource'}</td>
                <td>{req.accessType}</td>
                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.reason}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{req.riskScore ?? 15}</span>
                    <RiskBadge level={req.riskLevel} />
                  </div>
                </td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(req.requestedOn).toLocaleDateString()} {new Date(req.requestedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {req.accessExpiresOn ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success-text)', fontWeight: 600 }}>
                      <Calendar size={12} />
                      <span>{new Date(req.accessExpiresOn).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>--</span>
                  )}
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
