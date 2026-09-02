import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import { Terminal, Shield, Globe, Monitor } from 'lucide-react';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await apiFetch('/logs/all');
      setLogs(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading security audit trail...
      </div>
    );
  }

  const headers = [
    'Timestamp',
    'Event Action',
    'User Profile',
    'Resource Target',
    'Category',
    'IP Address',
    'Location',
    'Risk Score',
    'Status Decision',
    'Audit Details'
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Enterprise Security Audit Logs</h1>
        <p className="page-subtitle">Immutable chronological ledger of authentication, authorization, and policy enforcement events</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={20} style={{ color: 'var(--primary)' }} />
            <span>Audit Trail Log Entries ({logs.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={logs}
            renderRow={(log) => (
              <tr key={log._id}>
                <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Shield size={14} style={{ color: log.status === 'Success' ? 'var(--success)' : 'var(--danger)' }} />
                    <span>{log.eventType}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{log.user ? log.user.fullName : 'System / Admin'}</td>
                <td style={{ fontWeight: 600 }}>{log.resource ? log.resource.name : <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                <td>{log.category}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.775rem' }}>{log.ipAddress}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{log.location ? `${log.location.city}, ${log.location.country}` : 'Unknown'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>{log.riskScore ?? 0}</span>
                    <RiskBadge level={log.riskScore >= 61 ? 'High' : log.riskScore >= 31 ? 'Medium' : 'Low'} />
                  </div>
                </td>
                <td>
                  <StatusBadge status={log.status === 'Success' ? 'Success' : log.status === 'Blocked' ? 'Blocked' : 'Failed'} />
                </td>
                <td style={{ fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                  {log.details}
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
