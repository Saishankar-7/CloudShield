import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import { History, Shield, Globe, Terminal } from 'lucide-react';

const AccessHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await apiFetch('/logs/my');
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
        Loading security logs...
      </div>
    );
  }

  const headers = [
    'Event Action',
    'Resource',
    'Category',
    'Action Type',
    'IP Address',
    'Location',
    'Risk Score',
    'Decision Status',
    'Date / Time'
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Personal Audit Trails</h1>
        <p className="page-subtitle">Historical records of authentication, validation, and resource access events</p>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} style={{ color: 'var(--primary)' }} />
            <span>Audit History Logs ({logs.length})</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={logs}
            renderRow={(log) => (
              <tr key={log._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Shield size={14} style={{ color: log.status === 'Success' ? 'var(--success)' : 'var(--danger)' }} />
                    <span>{log.eventType}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {log.resource ? log.resource.name : <span style={{ color: 'var(--text-muted)' }}>System / Auth</span>}
                </td>
                <td>{log.category}</td>
                <td>{log.accessAction || 'Interactive'}</td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{log.ipAddress}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{log.location ? `${log.location.city}, ${log.location.country}` : 'Unknown'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{log.riskScore ?? 0}</span>
                    <RiskBadge level={log.riskScore >= 61 ? 'High' : log.riskScore >= 31 ? 'Medium' : 'Low'} />
                  </div>
                </td>
                <td>
                  <StatusBadge status={log.status === 'Success' ? 'Allowed' : 'Blocked'} />
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AccessHistory;
