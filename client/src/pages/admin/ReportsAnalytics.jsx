import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import StatCard from '../../components/StatCard';
import BrandLogo from '../../components/BrandLogo';
import { BarChart3, TrendingUp, ShieldCheck, AlertOctagon, Terminal } from 'lucide-react';

const ReportsAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/reports/admin');
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err.message);
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        Loading security analytics...
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={26} glow={true} />
          <h1 className="page-title">Enterprise Analytics & Reports</h1>
        </div>
        <p className="page-subtitle">Security compliance logs, authentication rates, and risk trends breakdowns</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Row of Stat Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Users Directory"
            value={stats.cards.totalUsers.value}
            icon={ShieldCheck}
            trend="+8%"
            trendDirection="up"
            trendText=" vs last month"
          />
          <StatCard
            title="Gateway Authentication Rate"
            value="99.8%"
            icon={TrendingUp}
            iconColor="var(--success)"
            iconBg="var(--success-bg)"
            trend="+0.2%"
            trendDirection="up"
            trendText=" vs last month"
          />
          <StatCard
            title="MFA Intercept Rate"
            value="7.8%"
            icon={BarChart3}
            iconColor="var(--warning)"
            iconBg="var(--warning-bg)"
            trend="+1.2%"
            trendDirection="up"
            trendText=" vs last month"
          />
          <StatCard
            title="Threat Block Rate"
            value="15.3%"
            icon={AlertOctagon}
            iconColor="var(--danger)"
            iconBg="var(--danger-bg)"
            trend="-2.4%"
            trendDirection="down"
            trendText=" vs last month"
          />
        </div>

        {/* Analytics Details Card */}
        <div className="glass-card">
          <h2 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20 }}>
            System Access Analytics Summary
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: 24 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-muted)' }}>Access Request Statistics</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Allowed Connections (Week)</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{stats.charts.accessOverview.allowed}</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Blocked Threats (Week)</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{stats.charts.accessOverview.denied}</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Multi-Factor Challenges Issued</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{stats.cards.mfaChallenges.value}</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 10, fontWeight: 700 }}>
                  <span>Total Gateway Requests Evaluated</span>
                  <span>{stats.cards.totalRequests.value}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-muted)' }}>User Risk Breakdown</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Low Risk Profiles (Score 0-30)</span>
                  <span style={{ fontWeight: 700 }}>{stats.charts.riskDistribution.lowPercent}%</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Medium Risk Profiles (Score 31-60)</span>
                  <span style={{ fontWeight: 700 }}>{stats.charts.riskDistribution.mediumPercent}%</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>High Risk Incident Profiles (Score 61-100)</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{stats.charts.riskDistribution.highPercent}%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Audit reports status */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--primary)' }}>
          <Terminal size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Continuous Compliance Certification</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              CloudShield Zero Trust Engine is operating in compliance with ISO 27001 / SOC 2 security log specifications. Continuous audit logging is active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
