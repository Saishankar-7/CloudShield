/**
 * Standalone High-Fidelity Client-Side Fallback Dataset
 * Ensures instant, zero-latency rendering and 100% offline/deployed reliability for:
 * - Enterprise Policies & Standards Documents
 * - HR Employee & Payroll Vault
 * - Operations & Security Reports
 * - Cloud Telemetry & Analytics Dashboard
 * - Administrative Terminal & Server Clusters
 */

export const FALLBACK_DOCUMENTS = [
  {
    id: 'DOC-2026-001',
    title: 'Enterprise Zero Trust Architecture & Continuous Verification Standard',
    category: 'Security & Compliance',
    classification: 'Confidential',
    version: 'v3.2',
    author: 'Alexander Vance (Director of Cybersecurity)',
    lastUpdated: '2026-01-15',
    effectiveDate: '2026-02-01',
    summary: 'Standard operating specifications for least-privilege enclave isolation, continuous context-aware authentication, and automated session revocation.',
    content: `### 1. Purpose & Scope
This policy mandates the continuous authentication, micro-segmentation, and device posture telemetry required across all CloudShield enterprise digital resources and cloud repositories.

### 2. Core Architectural Pillars
- **Verify Explicitly**: Always authenticate and authorize based on all available data points (identity, location, device health, service, and anomaly telemetry).
- **Use Least-Privilege Access**: Limit user access with Just-In-Time (JIT) and Just-Enough-Access (JEA), Risk-Based adaptive policies, and data protection.
- **Assume Breach**: Minimize blast radius by segmenting access by network, user, devices, and application awareness. Encrypt all end-to-end traffic.

### 3. Identity & Access Management (IAM)
- Multi-Factor Authentication (MFA) is strictly required for all internal enclaves, cloud infrastructure roots, and high-sensitivity databases.
- Passwords must comply with minimum 16-character alphanumeric complexity and rotate on compromise detection.

### 4. Device Posture & Compliance
- Only registered and MDM-enrolled workstations (Windows 11 Enterprise, macOS Sonoma, hardened Linux) are authorized for Level 4+ data access.
- Any unpatched OS or disabled endpoint firewall immediately triggers an automatic Step-Up MFA Challenge.`,
    tags: ['Zero-Trust', 'Architecture', 'ISO-27001', 'SOC-2'],
  },
  {
    id: 'DOC-2026-002',
    title: 'Cloud Incident Response & Forensic Triage Playbook',
    category: 'Operations & SOC',
    classification: 'Top Secret',
    version: 'v2.4',
    author: 'Deepak Reddy (DevSecOps Lead)',
    lastUpdated: '2026-02-10',
    effectiveDate: '2026-02-15',
    summary: 'Defines rapid escalation triggers, containment protocols, forensic snapshot procedures, and statutory notification timelines for security incidents.',
    content: `### 1. Incident Classification Levels
- **P1 (Critical)**: Active data exfiltration, root credential compromise, or ransomware propagation. *Response SLA: < 5 Minutes*.
- **P2 (High)**: Unauthorized privilege escalation or multi-account brute force anomaly. *Response SLA: < 15 Minutes*.
- **P3 (Medium)**: Single policy violation or abnormal geolocation flag. *Response SLA: < 1 Hour*.

### 2. Immediate Containment Workflow
1. **Isolate Workstation**: Disconnect affected host from network mesh via Zero-Trust Policy Engine revocation.
2. **Revoke Session Tokens**: Invalidate active JWTs and purge Redis cache for target user UID.
3. **Preserve Volatile Memory**: Trigger CloudShield audit snapshot before VM termination.
4. **Notify SOC Commander**: Page on-call incident coordinator and legal counsel.

### 3. Forensic Evidence Chain
All packet captures, log streams, and ephemeral container state must be hashed with SHA-256 and stored in an immutable WORM (Write Once, Read Many) S3 bucket.`,
    tags: ['Incident-Response', 'SOC', 'Forensics', 'Playbook'],
  },
  {
    id: 'DOC-2026-003',
    title: 'Employee Code of Conduct & Remote Work Security Standard',
    category: 'HR & Governance',
    classification: 'Internal',
    version: 'v4.1',
    author: 'Ananya Patel (Head of HR)',
    lastUpdated: '2025-11-20',
    effectiveDate: '2026-01-01',
    summary: 'Comprehensive guidelines on ethical integrity, remote workplace security, clean desk standards, and acceptable use of enterprise compute assets.',
    content: `### 1. General Principles
All employees, contractors, and affiliates are expected to uphold the highest standards of professional ethics, privacy protection, and operational security.

### 2. Remote Workstation Guidelines
- Never leave active sessions unattended in public spaces. Screen lock timeout is enforced at 3 minutes of inactivity.
- Public Wi-Fi connections (airports, cafes) require the CloudShield Zero-Trust Tunnel at all times.
- Storing confidential customer data or source code on personal USB thumb drives is strictly prohibited.

### 3. Phishing & Social Engineering Awareness
- Employees must report suspicious emails or unusual credential requests to \`security@cloudshield.internal\` within 30 minutes.
- Periodic simulated phishing exercises are conducted across all departments.`,
    tags: ['HR', 'Code-of-Conduct', 'Remote-Work', 'Compliance'],
  },
  {
    id: 'DOC-2026-004',
    title: 'ISO/IEC 27001 & SOC-2 Type II Compliance Manual',
    category: 'Security & Compliance',
    classification: 'Restricted',
    version: 'v5.0',
    author: 'Zara Al-Mansoor (Head of Legal & Compliance)',
    lastUpdated: '2026-01-05',
    effectiveDate: '2026-01-05',
    summary: 'Documentation of operational audit controls, annual penetration testing requirements, encryption key lifecycles, and risk registers.',
    content: `### 1. Control Framework Overview
CloudShield operates under continuous SOC-2 Type II (Security, Availability, Confidentiality) and ISO/IEC 27001:2022 certifications.

### 2. Cryptographic Controls (Annex A.10)
- All data at rest is encrypted using AES-256-GCM.
- All data in transit requires TLS 1.3 with Perfect Forward Secrecy (PFS).
- Cryptographic keys are rotated automatically every 90 days via AWS KMS / Cloudflare Keyless SSL.

### 3. Continuous Audit & Logging
Access logs, policy evaluation traces, and administrative overrides are immutably archived with automated tamper-detection checksums.`,
    tags: ['ISO-27001', 'SOC-2', 'Audit', 'Legal'],
  },
];

export const FALLBACK_REPORTS = {
  sprintPerformance: {
    sprintName: 'Sprint 42: Zero-Trust Telemetry & Cloud Vault',
    duration: 'Feb 15, 2026 - Feb 28, 2026',
    status: 'Completed',
    storyPointsPlanned: 150,
    storyPointsCompleted: 142,
    completionRate: '94.6%',
    velocityTrend: '+12.4%',
    pullRequestsMerged: 38,
    unitTestCoverage: '98.2%',
    criticalBugs: 0,
    highlights: [
      'Implemented Cloudinary HTTPS REST streaming proxy with fallback',
      'Deployed Port-443 Brevo and Resend cloud email dispatch engine',
      'Integrated real-time biometric and TOTP Authenticator skew tolerance',
      'Completed zero-downtime MongoDB replica sync',
    ],
  },
  securityAuditQ1: {
    quarter: 'Q1 2026',
    overallRiskRating: 'Low (Score: 14 / 100)',
    totalAccessEvents: '2,481,200',
    allowedTraffic: '98.4%',
    blockedAnomalies: '1.2%',
    mfaStepUps: '0.4%',
    vulnerabilitiesPatched: 18,
    zeroDayThreats: 0,
    complianceStatus: '100% SOC-2 Compliant',
    auditor: 'KPMG Cyber Trust Services',
    auditDate: 'Feb 2026',
  },
  cloudInfrastructureCost: {
    period: 'February 2026',
    totalMonthlySpend: '$26,600 USD',
    budgetUtilization: '88.6%',
    breakdown: [
      { service: 'AWS Cloud Compute (EKS & EC2)', cost: '$14,850', percentage: '55.8%', trend: '-3.2%' },
      { service: 'Azure AI & Security Enclaves', cost: '$8,200', percentage: '30.8%', trend: '+1.5%' },
      { service: 'Cloudinary CDN Vault Storage', cost: '$2,400', percentage: '9.0%', trend: '+0.4%' },
      { service: 'Datadog & Telemetry Logging', cost: '$1,150', percentage: '4.4%', trend: '-0.8%' },
    ],
  },
  slaAvailability: [
    { service: 'Zero-Trust Policy Engine', uptime: '99.99%', latencyP95: '12ms', status: 'Operational' },
    { service: 'Authentication & MFA Gateway', uptime: '99.98%', latencyP95: '24ms', status: 'Operational' },
    { service: 'Cloudinary Document Vault', uptime: '100.00%', latencyP95: '45ms', status: 'Operational' },
    { service: 'Audit Trail & Telemetry Bus', uptime: '99.99%', latencyP95: '8ms', status: 'Operational' },
  ],
};

export const FALLBACK_ANALYTICS = {
  summary: {
    totalRequests24h: '1,428,950',
    activeUsersNow: 48,
    avgLatencyMs: 18,
    p95LatencyMs: 34,
    policyDecisionRate: '99.99%',
    threatMitigations: 14,
  },
  decisionBreakdown: {
    allowPercent: 86.4,
    mfaChallengePercent: 11.8,
    denyBlockedPercent: 1.8,
  },
  trafficHourly: [
    { hour: '00:00', requests: 32000, allowed: 31200, blocked: 800 },
    { hour: '04:00', requests: 18000, allowed: 17800, blocked: 200 },
    { hour: '08:00', requests: 94000, allowed: 92000, blocked: 2000 },
    { hour: '12:00', requests: 186000, allowed: 182000, blocked: 4000 },
    { hour: '16:00', requests: 210000, allowed: 206000, blocked: 4000 },
    { hour: '20:00', requests: 145000, allowed: 142000, blocked: 3000 },
  ],
  geographicDistribution: [
    { country: 'India', flag: '🇮🇳', requests: '598,200', percentage: 41.8, riskScore: 12 },
    { country: 'United States', flag: '🇺🇸', requests: '402,100', percentage: 28.1, riskScore: 16 },
    { country: 'Singapore', flag: '🇸🇬', requests: '198,400', percentage: 13.9, riskScore: 10 },
    { country: 'Germany', flag: '🇩🇪', requests: '142,800', percentage: 10.0, riskScore: 14 },
    { country: 'United Kingdom', flag: '🇬🇧', requests: '87,450', percentage: 6.2, riskScore: 15 },
  ],
  deviceDistribution: [
    { name: 'Windows 11 Enterprise (MDM Enrolled)', count: '772,000', percentage: 54.0, trusted: true },
    { name: 'macOS Sonoma (Corporate Managed)', count: '457,000', percentage: 32.0, trusted: true },
    { name: 'Hardened Linux Workstations', count: '143,000', percentage: 10.0, trusted: true },
    { name: 'Mobile / iPadOS (Secured Container)', count: '57,000', percentage: 4.0, trusted: true },
  ],
  threatLog: [
    { time: '10 mins ago', type: 'Impossible Travel Anomaly', ip: '185.220.101.5', location: 'Frankfurt -> Tokyo in 4 mins', action: 'Auto-Blocked' },
    { time: '28 mins ago', type: 'High Velocity Brute Force', ip: '45.154.255.89', location: 'Tor Exit Node', action: 'Rate-Limited & IP Banned' },
    { time: '1 hour ago', type: 'Untrusted Root Device Header', ip: '103.21.244.0', location: 'Unknown Client', action: 'Step-Up MFA Enforced' },
  ],
};

export const FALLBACK_ADMIN_PANEL = {
  systemStatus: 'Operational',
  uptime: '99.99%',
  kernelVersion: 'Linux 6.8.0-cloudshield-zt-x86_64',
  policyEngineStatus: 'Active (Zero Trust Mesh Enforcement: 100%)',
  serverClusters: [
    {
      id: 'cluster-auth-01',
      name: 'prod-auth-gateway-01',
      role: 'Zero Trust Ingress & Identity Gateway',
      status: 'Online',
      cpu: '18%',
      memory: '3.4 GB / 8 GB',
      latency: '12ms',
      uptime: '48d 14h',
      ipAddress: '10.120.4.15',
      activeSessions: 342,
    },
    {
      id: 'cluster-fw-02',
      name: 'prod-firewall-cluster-02',
      role: 'Stateful Packet Inspection & IPSec Tunnel',
      status: 'Online',
      cpu: '31%',
      memory: '5.1 GB / 16 GB',
      latency: '4ms',
      uptime: '112d 08h',
      ipAddress: '10.120.4.22',
      activeSessions: 1280,
    },
    {
      id: 'cluster-db-01',
      name: 'prod-db-postgres-primary',
      role: 'Encrypted Vault & Transaction Cluster',
      status: 'Online',
      cpu: '24%',
      memory: '14.2 GB / 32 GB',
      latency: '8ms',
      uptime: '94d 21h',
      ipAddress: '10.120.8.10',
      activeSessions: 42,
    },
    {
      id: 'cluster-cache-03',
      name: 'prod-redis-cache-cluster',
      role: 'In-Memory Session & Token Store',
      status: 'Online',
      cpu: '9%',
      memory: '2.1 GB / 8 GB',
      latency: '1ms',
      uptime: '150d 02h',
      ipAddress: '10.120.8.44',
      activeSessions: 890,
    },
  ],
  firewallMetrics: {
    activeRules: 148,
    packetsProcessedToday: '42.8M',
    roguePacketsDroppedToday: '14,280',
    ddosMitigationStatus: 'Engaged (Tier 1 Protection)',
    ipsecTunnels: 4,
    tunnelsActive: '4 / 4 Connected (Zero Packet Loss)',
  },
  auditStream: [
    {
      timestamp: '2 mins ago',
      severity: 'Low',
      event: 'Zero-Trust Mesh Token Verified',
      source: '192.168.1.10',
      target: '/api/resources/admin-panel',
      action: 'ALLOW',
    },
    {
      timestamp: '14 mins ago',
      severity: 'High',
      event: 'Unauthorized Port Scan Intercepted',
      source: '185.220.101.5',
      target: 'Port 22 (SSH)',
      action: 'BLOCKED (Firewall Rule #42)',
    },
    {
      timestamp: '38 mins ago',
      severity: 'Medium',
      event: 'Elevated Risk Access Challenge (MFA)',
      source: '203.0.113.88',
      target: '/api/resources/employee-data',
      action: 'MFA_CHALLENGE_ISSUED',
    },
    {
      timestamp: '1 hour ago',
      severity: 'Low',
      event: 'Firewall Routing Table Synchronized',
      source: 'prod-firewall-cluster-02',
      target: 'IPSec Gateway',
      action: 'SYNC_SUCCESS',
    },
  ],
};

export const FALLBACK_EMPLOYEES = [
  {
    employeeId: 'EMP-2025-0101',
    fullName: 'Sai Kumar',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    email: 'sai@company.com',
    phone: '+91 98765 43210',
    salary: '$138,000',
    annualCompensation: '₹28,50,000',
    securityClearance: 'Level 4 (Top Secret)',
    location: 'Mumbai, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2022-03-15',
    manager: 'Ravi Teja',
    performanceRating: '4.9 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0102',
    fullName: 'Priya Sharma',
    jobTitle: 'Principal Cloud Architect',
    department: 'Engineering',
    email: 'priya.sharma@company.com',
    phone: '+91 98112 34567',
    salary: '$165,000',
    annualCompensation: '₹34,00,000',
    securityClearance: 'Level 5 (Superuser Clearance)',
    location: 'Bangalore, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2021-06-10',
    manager: 'Ravi Teja',
    performanceRating: '4.95 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0103',
    fullName: 'Ravi Teja',
    jobTitle: 'VP of Global Engineering',
    department: 'Engineering',
    email: 'ravi.teja@company.com',
    phone: '+91 98450 11223',
    salary: '$225,000',
    annualCompensation: '₹48,00,000',
    securityClearance: 'Level 5 (Executive Admin)',
    location: 'Hyderabad, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2019-01-20',
    manager: 'Elena Rostova (CTO)',
    performanceRating: '5.0 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0104',
    fullName: 'Ananya Patel',
    jobTitle: 'Head of Global People Operations',
    department: 'HR',
    email: 'ananya.patel@company.com',
    phone: '+91 97123 45678',
    salary: '$142,000',
    annualCompensation: '₹29,00,000',
    securityClearance: 'Level 4 (Confidential HR)',
    location: 'Delhi NCR, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2020-08-15',
    manager: 'Executive Team',
    performanceRating: '4.85 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0105',
    fullName: 'Alexander Vance',
    jobTitle: 'Director of Cybersecurity & Threat Intel',
    department: 'Security',
    email: 'alexander.vance@company.com',
    phone: '+1 (415) 890-1234',
    salary: '$195,000',
    annualCompensation: '₹40,00,000',
    securityClearance: 'Level 5 (Top Secret Enclave)',
    location: 'San Francisco, CA',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2020-02-01',
    manager: 'CISO Office',
    performanceRating: '4.98 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0106',
    fullName: 'Kavita Iyer',
    jobTitle: 'VP of Finance & Corporate Strategy',
    department: 'Finance',
    email: 'kavita.iyer@company.com',
    phone: '+91 99887 66554',
    salary: '$180,000',
    annualCompensation: '₹37,00,000',
    securityClearance: 'Level 4 (Financial Vault)',
    location: 'Chennai, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2021-04-12',
    manager: 'CFO Office',
    performanceRating: '4.9 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120',
  },
];
