import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
import {
  Users,
  Inbox,
  CheckCircle,
  XCircle,
  KeyRound,
  ShieldAlert,
  AlertOctagon,
  Terminal,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Lock,
  UserX,
  FileSpreadsheet
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [reviewingReq, setReviewingReq] = useState(null);
  const [notes, setNotes] = useState('');
  const [reviewType, setReviewType] = useState(''); // 'Approved' | 'Denied'
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      const statsData = await apiFetch('/reports/admin');
      setStats(statsData);

      const requestsData = await apiFetch('/requests/all');
      setRequests(requestsData.slice(0, 5)); // show latest 5 access requests

      const logsData = await apiFetch('/logs/all');
      setLogs(logsData.slice(0, 5)); // show latest 5 audit logs

      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err.message);
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
          expiryHours: 24, // approved access expires in 24 hours
        },
      });

      setReviewingReq(null);
      setNotes('');
      fetchAdminDashboard(); // reload stats and tables
    } catch (err) {
      setActionError(err.message || 'Failed to submit review decision.');
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading enterprise admin dashboard...
      </div>
    );
  }

  // Helper to draw clean SVG donut chart
  const renderDonutChart = (percent, color1 = '#10b981', color2 = '#ef4444', label1 = '', label2 = '') => {
    const radius = 50;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="donut-chart-container">
        <div className="donut-svg-wrapper">
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
            {/* Foreground Fill Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color1}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="donut-center-label">
            <span className="donut-center-value">{percent}%</span>
            <span className="donut-center-sub">{label1}</span>
          </div>
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color1 }}></div>
            <span>{label1}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color2 }}></div>
            <span>{label2}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">IT Security Operations Dashboard</h1>
        </div>
        <p className="page-subtitle">Real-time Zero Trust gateway overview and activity monitoring</p>
      </div>

      {/* Row of Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          title="Total Users"
          value={stats.cards.totalUsers.value}
          icon={Users}
          trend={stats.cards.totalUsers.change}
          trendDirection="up"
          trendText=" from last week"
        />
        <StatCard
          title="Total Requests"
          value={stats.cards.totalRequests.value}
          icon={Inbox}
          trend={stats.cards.totalRequests.change}
          trendDirection="up"
          trendText=" from last week"
        />
        <StatCard
          title="Allowed Requests"
          value={stats.cards.allowedRequests.value}
          icon={CheckCircle}
          iconColor="var(--success)"
          iconBg="var(--success-bg)"
          trend={stats.cards.allowedRequests.change}
          trendDirection="up"
          trendText=" from last week"
        />
        <StatCard
          title="Denied Requests"
          value={stats.cards.deniedRequests.value}
          icon={XCircle}
          iconColor="var(--danger)"
          iconBg="var(--danger-bg)"
          trend={stats.cards.deniedRequests.change}
          trendDirection="down"
          trendText=" from last week"
        />
        <StatCard
          title="MFA Challenges"
          value={stats.cards.mfaChallenges.value}
          icon={KeyRound}
          iconColor="var(--warning)"
          iconBg="var(--warning-bg)"
          trend={stats.cards.mfaChallenges.change}
          trendDirection="up"
          trendText=" from last week"
        />
        <StatCard
          title="High Risk Events"
          value={stats.cards.highRiskEvents.value}
          icon={AlertOctagon}
          iconColor="var(--danger)"
          iconBg="var(--danger-bg)"
          trend={stats.cards.highRiskEvents.change}
          trendDirection="down"
          trendText=" from last week"
        />
      </div>

      {/* Donut Charts Row */}
      <div className="charts-row">
        {/* Chart 1: Access Overview */}
        <div className="glass-card">
          <h2 className="card-title" style={{ marginBottom: 12 }}>Access Overview (This Week)</h2>
          {renderDonutChart(
            stats.charts.accessOverview.allowedPercent,
            'var(--success)',
            'var(--danger)',
            'Allowed',
            'Denied'
          )}
        </div>

        {/* Chart 2: Risk Distribution */}
        <div className="glass-card">
          <h2 className="card-title" style={{ marginBottom: 12 }}>Risk Distribution</h2>
          <div className="donut-chart-container" style={{ justifyContent: 'space-around' }}>
            {/* Draw a multi-segment look with Low risk primary */}
            <div className="donut-svg-wrapper">
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="12"
                  strokeDasharray="314.15"
                  strokeDashoffset={314.15 - (60 / 100) * 314.15}
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center-label">
                <span className="donut-center-value">60%</span>
                <span className="donut-center-sub">Low Risk</span>
              </div>
            </div>

            <div className="chart-legend" style={{ fontSize: '0.8rem' }}>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--success)' }}></div>
                <span>Low Risk (0-30): <b>60%</b></span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--warning)' }}></div>
                <span>Medium Risk (31-60): <b>25%</b></span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--danger)' }}></div>
                <span>High Risk (61-100): <b>15%</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Access Requests (Left) & Risky Users (Right) */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        {/* Left: Pending/Recent Access Requests */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Recent Access Requests</h2>
          </div>

          <DataTable
            headers={['User Name', 'Resource', 'Risk Score', 'Decision', 'Actions']}
            data={requests}
            renderRow={(req) => (
              <tr key={req._id}>
                <td style={{ fontWeight: 600 }}>{req.user ? req.user.fullName : 'Unknown User'}</td>
                <td style={{ fontWeight: 700 }}>{req.resource ? req.resource.name : 'System Access'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{req.riskScore ?? 15}</span>
                    <RiskBadge level={req.riskLevel} />
                  </div>
                </td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
                <td>
                  {req.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleReviewAction(req, 'Approved')}
                        className="btn btn-success btn-sm"
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleReviewAction(req, 'Denied')}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reviewed</span>
                  )}
                </td>
              </tr>
            )}
          />
        </div>

        {/* Right: Top Risky Users */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Top Risky Users</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.topRiskyUsers.map((rUser, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                    {rUser.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rUser.fullName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{rUser.riskScore}</span>
                  <RiskBadge level={rUser.riskLevel} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Security Logs (Left) & Blocked Resources (Right) */}
      <div className="dashboard-grid">
        {/* Left: Latest Security Logs */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Security Logs (Latest)</h2>
          </div>

          <DataTable
            headers={['Time', 'User', 'Resource', 'IP Address', 'Location', 'Decision']}
            data={logs}
            renderRow={(log) => (
              <tr key={log._id}>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ fontWeight: 600 }}>{log.user ? log.user.fullName : 'System'}</td>
                <td style={{ fontWeight: 600 }}>{log.resource ? log.resource.name : 'Authentication'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.775rem' }}>{log.ipAddress}</td>
                <td style={{ fontSize: '0.8rem' }}>{log.location ? log.location.country : 'India'}</td>
                <td>
                  <StatusBadge status={log.status === 'Success' ? 'Allowed' : 'Blocked'} />
                </td>
              </tr>
            )}
          />
        </div>

        {/* Right: Top Blocked Resources */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Top Blocked Resources</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.topBlockedResources.map((resItem, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{resItem.name}</span>
                <span className="badge badge-danger" style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                  {resItem.count} Blocks
                </span>
              </div>
            ))}
          </div>
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

export default AdminDashboard;
