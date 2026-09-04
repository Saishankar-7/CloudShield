import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  Server
} from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ReportsViewer({ resource }) {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sprint'); // 'sprint' | 'security' | 'costs' | 'sla'

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/resources/reports/records');
      if (data && data.reports) {
        setReportsData(data.reports);
      }
    } catch (err) {
      console.error('Failed to load reports records:', err);
    } finally {
      setLoading(false);
    }
  };

  const sprint = reportsData?.sprintPerformance || {};
  const security = reportsData?.securityAuditQ1 || {};
  const costs = reportsData?.cloudInfrastructureCost || {};
  const sla = reportsData?.slaAvailability || [];

  const handleExportSummary = () => {
    const csvContent = `CloudShield Operations & Engineering Report\nExported: ${new Date().toUTCString()}\n\n` +
      `Sprint,${sprint.sprintName}\nCompletion Rate,${sprint.completionRate}\nStory Points,${sprint.storyPointsCompleted}/${sprint.storyPointsPlanned}\n\n` +
      `Security Audit,${security.quarter}\nRisk Rating,${security.overallRiskRating}\nTotal Access Events,${security.totalAccessEvents}\n\n` +
      `Monthly Cloud Cost,${costs.totalMonthlySpend}\nBudget Utilization,${costs.budgetUtilization}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CloudShield_Executive_Report_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            }}
          >
            <BarChart3 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Executive Performance & Engineering Reports
              </h3>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                Verified Q1 2026
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sprint Burndown • SOC-2 Compliance Audit • Cloud Cost Allocation • SLA Uptime
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportSummary}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'sprint' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sprint')}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <TrendingUp size={14} />
          <span>Sprint Velocity</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('security')}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShieldCheck size={14} />
          <span>Security Audit</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'costs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('costs')}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <DollarSign size={14} />
          <span>Cloud Costs</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'sla' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sla')}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Server size={14} />
          <span>SLA Availability</span>
        </button>
      </div>

      {/* Tab 1: Sprint Velocity */}
      {activeTab === 'sprint' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Completion Rate</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--success-text)', display: 'block', margin: '4px 0' }}>{sprint.completionRate || '94.6%'}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sprint.storyPointsCompleted} / {sprint.storyPointsPlanned} Points</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>PRs Merged</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)', display: 'block', margin: '4px 0' }}>{sprint.pullRequestsMerged || 38}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Test Coverage: {sprint.unitTestCoverage}</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Velocity Trend</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--success)', display: 'block', margin: '4px 0' }}>{sprint.velocityTrend || '+12.4%'}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0 Critical Blockers</span>
            </div>
          </div>

          {/* Highlights List */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700 }}>Key Accomplishments in {sprint.sprintName}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(sprint.highlights || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Risk Rating</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--success-text)', display: 'block', margin: '4px 0' }}>{security.overallRiskRating}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Audited by {security.auditor}</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed Traffic Rate</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--primary)', display: 'block', margin: '4px 0' }}>{security.allowedTraffic}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{security.totalAccessEvents} Total Events</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Threats Mitigated</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--warning)', display: 'block', margin: '4px 0' }}>18 Patched</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0 Zero-Day Vulnerabilities</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>SOC-2 Type II Compliance Badge</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Continuous automated evidence harvesting and zero-exception attestation.</p>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {security.complianceStatus || '100% Compliant'}
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Cloud Costs */}
      {activeTab === 'costs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Monthly Spend ({costs.period})</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)', display: 'block' }}>{costs.totalMonthlySpend}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget Utilization</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--success-text)', display: 'block' }}>{costs.budgetUtilization}</strong>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Cloud Service</th>
                  <th style={{ padding: '10px 14px' }}>Spend</th>
                  <th style={{ padding: '10px 14px' }}>% of Total</th>
                  <th style={{ padding: '10px 14px' }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {(costs.breakdown || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.service}</td>
                    <td style={{ padding: '10px 14px' }}>{item.cost}</td>
                    <td style={{ padding: '10px 14px' }}>{item.percentage}</td>
                    <td style={{ padding: '10px 14px', color: item.trend.startsWith('-') ? 'var(--success)' : 'var(--warning)' }}>{item.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: SLA Availability */}
      {activeTab === 'sla' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Subsystem Microservice</th>
                <th style={{ padding: '10px 14px' }}>30-Day Uptime</th>
                <th style={{ padding: '10px 14px' }}>P95 Latency</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sla.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.service}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--success-text)', fontWeight: 700 }}>{item.uptime}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{item.latencyP95}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
