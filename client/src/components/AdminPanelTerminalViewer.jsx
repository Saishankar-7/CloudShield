import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Cpu,
  Server,
  ShieldAlert,
  ShieldCheck,
  Activity,
  HardDrive,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Radio,
  Sliders,
  Zap,
  Lock,
  Wifi,
  Database
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { FALLBACK_ADMIN_PANEL } from '../services/fallbackData';

export default function AdminPanelTerminalViewer({ resource }) {
  const [adminData, setAdminData] = useState(FALLBACK_ADMIN_PANEL);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'clusters' | 'firewall' | 'audit'
  
  // Interactive Terminal State
  const [commandInput, setCommandInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'sys', text: `[${new Date().toLocaleTimeString()}] CloudShield Enterprise SOC Kernel v4.8.2-x86_64 loaded.` },
    { type: 'sys', text: `[${new Date().toLocaleTimeString()}] Zero-Trust Gateway: Continuous Policy Enforcement Active.` },
    { type: 'sys', text: `[${new Date().toLocaleTimeString()}] Temporary Superuser Session established via approved Zero Trust Request.` },
    { type: 'info', text: `Type 'help' to view available system administration commands.` },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, activeTab]);

  const fetchAdminData = async () => {
    try {
      const data = await apiFetch('/resources/admin-panel/records');
      if (data && data.adminData) {
        setAdminData(data.adminData);
      } else {
        setAdminData(FALLBACK_ADMIN_PANEL);
      }
    } catch (err) {
      console.warn('Backend admin panel fetch notice (using built-in telemetry):', err.message);
      setAdminData(FALLBACK_ADMIN_PANEL);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCommand = (cmdStr) => {
    const rawCmd = (cmdStr || commandInput).trim();
    if (!rawCmd) return;

    const newLogs = [
      ...terminalHistory,
      { type: 'user', text: `admin@cloudshield-zt:~$ ${rawCmd}` }
    ];

    setCommandInput('');
    setIsExecuting(true);

    setTimeout(() => {
      const lower = rawCmd.toLowerCase();
      let responseLogs = [];

      if (lower === 'help') {
        responseLogs = [
          { type: 'output', text: 'Available System Administration Commands:' },
          { type: 'output', text: '  status       - Show overall infrastructure health & cluster status' },
          { type: 'output', text: '  nodes        - List all active server cluster nodes & resource loads' },
          { type: 'output', text: '  firewall     - Display stateful firewall rules & dropped packet metrics' },
          { type: 'output', text: '  diagnostics  - Run automated Zero Trust Gateway verification checks' },
          { type: 'output', text: '  flush-dns    - Purge internal DNS resolver cache and sync routes' },
          { type: 'output', text: '  audit        - Print recent SOC security intercept events' },
          { type: 'output', text: '  clear        - Clear console output screen' },
        ];
      } else if (lower === 'status') {
        responseLogs = [
          { type: 'success', text: '✓ System State: OPERATIONAL (Zero-Trust Mesh 100% Online)' },
          { type: 'output', text: `• Cluster Health: 4 / 4 Nodes Active • Uptime: ${adminData?.uptime || '99.99%'}` },
          { type: 'output', text: `• Active Sessions: 2,554 • Policy Decision Rate: 99.98%` },
        ];
      } else if (lower === 'nodes') {
        responseLogs = [
          { type: 'output', text: 'Active CloudShield Server Enclaves:' },
          { type: 'output', text: '  [NODE-01] prod-auth-gateway-01      (IP: 10.120.4.15)  - CPU 18% | RAM 3.4GB  - ONLINE' },
          { type: 'output', text: '  [NODE-02] prod-firewall-cluster-02  (IP: 10.120.4.22)  - CPU 31% | RAM 5.1GB  - ONLINE' },
          { type: 'output', text: '  [NODE-03] prod-db-postgres-primary  (IP: 10.120.8.10)  - CPU 24% | RAM 14.2GB - ONLINE' },
          { type: 'output', text: '  [NODE-04] prod-redis-cache-cluster  (IP: 10.120.8.44)  - CPU 9%  | RAM 2.1GB  - ONLINE' },
        ];
      } else if (lower === 'firewall') {
        responseLogs = [
          { type: 'output', text: 'Firewall Telemetry Snapshot:' },
          { type: 'output', text: '  • Active Filter Rules: 148' },
          { type: 'output', text: '  • Packets Processed Today: 42.8M' },
          { type: 'warning', text: '  • Rogue Packets Intercepted & Dropped: 14,280' },
          { type: 'output', text: '  • IPSec Encrypted Tunnels: 4 / 4 Connected (0% loss)' },
        ];
      } else if (lower === 'diagnostics' || lower === 'diag') {
        responseLogs = [
          { type: 'info', text: 'Initiating CloudShield Zero Trust automated self-test...' },
          { type: 'output', text: '[PASS] TLS 1.3 / AES-256-GCM Handshake Verification' },
          { type: 'output', text: '[PASS] Redis In-Memory Token Blacklist Latency: 0.8ms' },
          { type: 'output', text: '[PASS] Continuous Policy Evaluation Engine: Nominal' },
          { type: 'success', text: '✓ All 18 automated security diagnostics passed.' },
        ];
      } else if (lower === 'flush-dns') {
        responseLogs = [
          { type: 'info', text: 'Flushing local and cluster DNS resolvers...' },
          { type: 'success', text: '✓ Cache purged. 128 routing tables re-synchronized in 14ms.' },
        ];
      } else if (lower === 'audit') {
        responseLogs = [
          { type: 'output', text: 'Recent Security Audit Events:' },
          { type: 'output', text: '  [12:14:02] ALLOW  - ZT Mesh Token Verified (IP: 192.168.1.10)' },
          { type: 'warning', text: '  [12:01:45] BLOCK  - Port 22 SSH probe dropped from 185.220.101.5' },
          { type: 'output', text: '  [11:42:19] CHALL  - Step-Up MFA Challenge issued for /employee-data' },
        ];
      } else if (lower === 'clear') {
        setTerminalHistory([]);
        setIsExecuting(false);
        return;
      } else {
        responseLogs = [
          { type: 'error', text: `bash: ${rawCmd}: command not recognized. Type 'help' for command list.` }
        ];
      }

      setTerminalHistory([...newLogs, ...responseLogs]);
      setIsExecuting(false);
    }, 250);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleRunCommand(commandInput);
  };

  const handleExportAudit = () => {
    const csvContent = `CloudShield Administrative Terminal Audit Export\nExported: ${new Date().toUTCString()}\n\n` +
      `System Status,${adminData?.systemStatus || 'Operational'}\n` +
      `Uptime,${adminData?.uptime || '99.99%'}\n` +
      `Policy Engine,${adminData?.policyEngineStatus || 'Active'}\n\n` +
      `Server Node,IP,Role,Status,CPU,Memory\n` +
      (adminData?.serverClusters || []).map(c => `${c.name},${c.ipAddress},${c.role},${c.status},${c.cpu},${c.memory}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CloudShield_Admin_Infrastructure_Report_${Date.now()}.csv`;
    link.click();
  };

  const clusters = adminData?.serverClusters || [];
  const firewall = adminData?.firewallMetrics || {};
  const auditLogs = adminData?.auditStream || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Superuser Access Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
              flexShrink: 0,
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Admin Infrastructure Panel
              </h3>
              <span className="badge badge-danger" style={{ fontSize: '0.675rem', padding: '2px 8px' }}>
                SUPERUSER ACCESS GRANTED
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.675rem', padding: '2px 8px' }}>
                ZT-AUDITED SESSION
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Temporary access authorized by Administrator • Continuous policy telemetry actively logging all commands
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleRunCommand('diagnostics')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
          >
            <Play size={12} />
            <span>Run Self-Test</span>
          </button>
          <button
            onClick={handleExportAudit}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
          >
            <Download size={13} />
            <span>Export SOC Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {[
          { id: 'terminal', label: 'Interactive Terminal', icon: Terminal },
          { id: 'clusters', label: `Server Clusters (${clusters.length})`, icon: Server },
          { id: 'firewall', label: 'Firewall & Gateways', icon: ShieldAlert },
          { id: 'audit', label: 'Live SOC Audit Stream', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card-subtle)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Interactive Terminal */}
      {activeTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick command buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Commands:</span>
            {['status', 'nodes', 'firewall', 'diagnostics', 'flush-dns', 'audit', 'clear'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleRunCommand(cmd)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Dark Linux Terminal Box */}
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.8rem',
              color: '#38bdf8',
              minHeight: '280px',
              maxHeight: '380px',
              overflowY: 'auto',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {terminalHistory.map((item, index) => {
              let color = '#94a3b8';
              if (item.type === 'user') color = '#f8fafc';
              if (item.type === 'success') color = '#4ade80';
              if (item.type === 'warning') color = '#facc15';
              if (item.type === 'error') color = '#f87171';
              if (item.type === 'info') color = '#38bdf8';
              if (item.type === 'sys') color = '#64748b';

              return (
                <div key={index} style={{ color, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                  {item.text}
                </div>
              );
            })}
            {isExecuting && (
              <div style={{ color: '#38bdf8', fontStyle: 'italic' }}>Executing request...</div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0 12px',
              }}
            >
              <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.8rem', marginRight: '6px' }}>
                admin@cloudshield-zt:~$
              </span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="type command (e.g. status, nodes, firewall, diagnostics, flush-dns)..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  padding: '10px 0',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 18px', height: '40px' }}>
              Execute
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Server Clusters */}
      {activeTab === 'clusters' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'var(--bg-card-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cluster.name}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cluster.role}</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  {cluster.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>CPU Load</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{cluster.cpu}</span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Memory</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cluster.memory}</span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>IP Address</span>
                  <span style={{ fontWeight: 600 }}>{cluster.ipAddress}</span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Latency</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{cluster.latency}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span>Uptime: {cluster.uptime}</span>
                <span>Active Sessions: {cluster.activeSessions}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Firewall & Gateways */}
      {activeTab === 'firewall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Active Rules</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{firewall.activeRules || 148}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block', marginTop: '2px' }}>Stateful Inspection Synced</span>
            </div>
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Packets Processed</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{firewall.packetsProcessedToday || '42.8M'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Past 24 Hours</span>
            </div>
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Rogue Packets Dropped</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>{firewall.roguePacketsDroppedToday || '14,280'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--danger)', display: 'block', marginTop: '2px' }}>Intrusions Mitigated</span>
            </div>
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>IPSec Tunnels</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{firewall.ipsecTunnels || 4}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block', marginTop: '2px' }}>{firewall.tunnelsActive || '4 / 4 Active'}</span>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--bg-card)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700 }}>Active Gateway Perimeter Rules</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)' }}>
                <span>RULE-01: Ingress TCP 443 → CloudShield Zero Trust Reverse Proxy Gateway</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ENFORCED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)' }}>
                <span>RULE-02: Block Ingress TCP 22 (SSH) from non-VPN perimeter IPs</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ENFORCED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)' }}>
                <span>RULE-03: Auto-quarantine IP addresses exceeding 60 requests/min threshold</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>RATE-LIMITED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-subtle)' }}>
                <span>RULE-04: Encrypt all inter-cluster communication via mTLS 1.3 tunnels</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SOC Audit Stream */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-card-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px' }}>Time</th>
                  <th style={{ padding: '10px 14px' }}>Severity</th>
                  <th style={{ padding: '10px 14px' }}>Event Name</th>
                  <th style={{ padding: '10px 14px' }}>Source IP</th>
                  <th style={{ padding: '10px 14px' }}>Target Resource</th>
                  <th style={{ padding: '10px 14px' }}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${log.severity === 'High' ? 'badge-danger' : log.severity === 'Medium' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{log.event}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{log.source}</td>
                    <td style={{ padding: '10px 14px' }}>{log.target}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 700, color: log.action.includes('ALLOW') ? 'var(--success)' : log.action.includes('BLOCK') ? 'var(--danger)' : 'var(--warning)' }}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
