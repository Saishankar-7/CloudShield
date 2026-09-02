import { useState, useEffect } from 'react';
import { Shield, Radio, AlertTriangle, CheckCircle2, Lock, Activity, RefreshCw } from 'lucide-react';

const mockThreatEvents = [
  { id: 1, type: 'Blocked', ip: '198.51.100.24', location: 'Frankfurt, DE', target: 'HR Directory DB', time: '12s ago', reason: 'Unrecognized Device Posture' },
  { id: 2, type: 'MFA', ip: '103.21.244.0', location: 'Singapore, SG', target: 'API Gateway', time: '34s ago', reason: 'Abnormal Location Velocity' },
  { id: 3, type: 'Verified', ip: '192.168.1.10', location: 'Mumbai, IN', target: 'Zero Trust Whitepaper', time: '1m ago', reason: 'Identity & TPM Chip Verified' },
  { id: 4, type: 'Verified', ip: '192.168.1.14', location: 'Mumbai, IN', target: 'Analytics Engine', time: '2m ago', reason: 'Managed Corporate Endpoint' },
  { id: 5, type: 'Blocked', ip: '203.0.113.88', location: 'Kyiv, UA', target: 'Admin Terminal', time: '3m ago', reason: 'Risk Score Critical (92)' },
];

const ThreatRadar = ({ logs = [] }) => {
  const [activeScope, setActiveScope] = useState('Global Mesh');
  const [radarAngle, setRadarAngle] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 2500);
    return () => clearInterval(pulseInterval);
  }, []);

  const displayEvents = logs.length > 0
    ? logs.slice(0, 5).map((l, idx) => ({
        id: l._id || idx,
        type: l.status === 'Blocked' || l.eventType === 'Access Denied' ? 'Blocked' : l.eventType === 'MFA Verification' ? 'MFA' : 'Verified',
        ip: l.ipAddress || '192.168.1.10',
        location: l.location?.city ? `${l.location.city}, ${l.location.country}` : 'Mumbai, IN',
        target: l.resource?.name || l.details || 'Enterprise Gateway',
        time: 'Active',
        reason: l.details || 'Zero-Trust Continuous Verification',
      }))
    : mockThreatEvents;

  return (
    <div className="threat-radar-container">
      {/* Header bar */}
      <div className="radar-header">
        <div className="radar-title-wrap">
          <div className="radar-status-dot"></div>
          <div>
            <h3 className="radar-title">Cyber Threat Radar & SOC Feed</h3>
            <span className="radar-subtitle">Continuous Zero-Trust Perimeter Monitoring</span>
          </div>
        </div>

        <div className="radar-scope-selector">
          {['Global Mesh', 'Perimeter', 'DB Vaults'].map(scope => (
            <button
              key={scope}
              className={`radar-scope-btn ${activeScope === scope ? 'active' : ''}`}
              onClick={() => setActiveScope(scope)}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      <div className="radar-content-grid">
        {/* Animated Visual Radar Screen */}
        <div className="radar-screen-wrapper">
          <div className="radar-screen">
            {/* Concentric rings */}
            <div className="radar-ring ring-1"></div>
            <div className="radar-ring ring-2"></div>
            <div className="radar-ring ring-3"></div>
            <div className="radar-crosshair-h"></div>
            <div className="radar-crosshair-v"></div>

            {/* Sweep beam */}
            <div
              className="radar-sweep"
              style={{
                transform: `rotate(${radarAngle}deg)`,
              }}
            />

            {/* Simulated Radar Blips */}
            <div className="radar-blip blip-verified" style={{ top: '35%', left: '42%' }}>
              <span className="blip-label">Sai-Win11</span>
            </div>
            <div className="radar-blip blip-mfa" style={{ top: '25%', left: '70%' }}>
              <span className="blip-label">VPN-Node</span>
            </div>
            <div className="radar-blip blip-blocked" style={{ top: '68%', left: '78%' }}>
              <span className="blip-label">Threat-IP</span>
            </div>
            <div className="radar-blip blip-verified" style={{ top: '60%', left: '30%' }}>
              <span className="blip-label">Admin-Core</span>
            </div>

            {/* Center Core */}
            <div className="radar-center-core">
              <Shield size={16} />
            </div>
          </div>

          <div className="radar-telemetry-hud">
            <div className="hud-metric">
              <span className="hud-label">SURFACE STATUS</span>
              <span className="hud-val hud-safe">DEFENDED</span>
            </div>
            <div className="hud-metric">
              <span className="hud-label">INTERCEPT LATENCY</span>
              <span className="hud-val">1.2ms</span>
            </div>
            <div className="hud-metric">
              <span className="hud-label">BEACON PULSES</span>
              <span className="hud-val">{pulseCount * 14 + 120}</span>
            </div>
          </div>
        </div>

        {/* Live SOC Incident Ticker */}
        <div className="soc-feed-wrapper">
          <div className="soc-feed-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Live Zero-Trust Intercepts
              </span>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Real-Time Stream</span>
          </div>

          <div className="soc-feed-list">
            {displayEvents.map((evt, i) => (
              <div key={evt.id || i} className={`soc-event-card event-${evt.type.toLowerCase()}`}>
                <div className="soc-event-icon">
                  {evt.type === 'Blocked' && <AlertTriangle size={15} color="#ef4444" />}
                  {evt.type === 'MFA' && <Radio size={15} color="#f59e0b" />}
                  {evt.type === 'Verified' && <CheckCircle2 size={15} color="#10b981" />}
                </div>
                <div className="soc-event-body">
                  <div className="soc-event-top">
                    <span className="soc-event-target">{evt.target}</span>
                    <span className={`soc-event-badge badge-${evt.type.toLowerCase()}`}>{evt.type}</span>
                  </div>
                  <p className="soc-event-reason">{evt.reason}</p>
                  <div className="soc-event-meta">
                    <span>{evt.ip}</span>
                    <span>•</span>
                    <span>{evt.location}</span>
                    <span>•</span>
                    <span>{evt.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatRadar;
