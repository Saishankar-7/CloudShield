import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  ExternalLink,
  Shield,
  Briefcase,
  DollarSign,
  MapPin,
  Building,
  CheckCircle,
  FileText,
  Lock,
  Eye,
  Filter
} from 'lucide-react';
import { apiFetch } from '../services/api';

const CLOUDINARY_PDF_URL =
  'https://res.cloudinary.com/dlxueeeau/raw/upload/v1788411013/cloudshield_hr/Enterprise_HR_Employee_Directory_2025.pdf';

export default function EmployeeDataViewer({ resource }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'pdf'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployeeRecords();
  }, []);

  const fetchEmployeeRecords = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/resources/employee-data/records');
      if (data && data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employee records:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', 'Engineering', 'Security', 'HR', 'Finance', 'Operations', 'Executive'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const pdfUrl = resource?.cloudStorage?.fileUrl || CLOUDINARY_PDF_URL;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Cloudinary Storage Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.25)',
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
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Building size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Enterprise HR & Payroll Vault
              </h3>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                Cloudinary Synced
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Encrypted Personnel Directory • Cloudinary Secure Storage • AES-256 Vault
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <Users size={14} />
            <span>Interactive Table</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('pdf')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <FileText size={14} />
            <span>Cloudinary PDF</span>
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            <span>Open Cloud URL</span>
          </a>
          <a
            href={pdfUrl}
            download="Enterprise_HR_Employee_Directory_2025.pdf"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Users size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Headcount</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{employees.length || 12}</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Avg Compensation</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>$160k / yr</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Shield size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Clearance Gate</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Level 5 Max</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <Lock size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Cloud Storage</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cloudinary</span>
          </div>
        </div>
      </div>

      {viewMode === 'pdf' ? (
        /* Cloudinary Live PDF Embed View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card-subtle)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} color="#10b981" />
              Streaming directly from Cloudinary CDN: <code>{pdfUrl.substring(0, 60)}...</code>
            </span>
          </div>
          <iframe
            src={pdfUrl}
            title="Cloudinary Employee Directory PDF"
            style={{
              width: '100%',
              height: '420px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      ) : (
        /* Interactive Data Directory View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Controls: Search and Department Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, ID, role, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Department Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: selectedDept === dept ? '#4f46e5' : 'var(--border-color)',
                    backgroundColor: selectedDept === dept ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-card)',
                    color: selectedDept === dept ? '#4f46e5' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: selectedDept === dept ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Directory Table */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Department & Role</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Salary / Compensation</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Clearance</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No employee records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.employeeId}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{emp.fullName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4f46e5', fontSize: '0.75rem' }}>
                          {emp.employeeId}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.jobTitle}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>{emp.salary}</div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{emp.annualCompensation}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          className={`badge ${
                            emp.securityClearance.includes('Level 5')
                              ? 'badge-danger'
                              : emp.securityClearance.includes('Level 4')
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                          style={{ fontSize: '0.675rem', padding: '2px 6px' }}
                        >
                          {emp.securityClearance.split('(')[0].trim()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>{emp.location}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>★ {emp.performanceRating.split('/')[0].trim()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
