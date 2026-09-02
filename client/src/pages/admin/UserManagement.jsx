import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import BrandLogo from '../../components/BrandLogo';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Shield,
  KeyRound,
  RefreshCw,
  Lock
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [riskValue, setRiskValue] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // New User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    phone: '',
    workLocation: 'India',
    employeeType: 'Full Time',
    riskScore: 10,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err.message);
      showAlert('error', `Failed to load users: ${err.message}`);
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await apiFetch(`/users/${userId}/role`, {
        method: 'PUT',
        body: { role: newRole },
      });
      showAlert('success', 'User role updated successfully in database.');
      fetchUsers();
    } catch (err) {
      showAlert('error', err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(true);
    try {
      await apiFetch(`/users/${userId}/status`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      showAlert('success', 'User status updated successfully in database.');
      fetchUsers();
    } catch (err) {
      showAlert('error', err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRiskEdit = (userItem) => {
    setEditingRisk(userItem._id);
    setRiskValue(userItem.riskScore);
  };

  const handleSaveRisk = async (userId) => {
    setActionLoading(true);
    try {
      await apiFetch(`/users/${userId}/risk`, {
        method: 'PUT',
        body: { riskScore: riskValue },
      });
      setEditingRisk(null);
      showAlert('success', 'User risk score updated in database.');
      fetchUsers();
    } catch (err) {
      showAlert('error', err.message || 'Failed to update risk score.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: formData,
      });
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'employee',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        phone: '',
        workLocation: 'India',
        employeeType: 'Full Time',
        riskScore: 10,
      });
      showAlert('success', 'New user account created and stored in MongoDB database.');
      fetchUsers();
    } catch (err) {
      showAlert('error', err.message || 'Failed to create user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await apiFetch(`/users/${userToDelete._id}`, {
        method: 'DELETE',
      });
      setUserToDelete(null);
      showAlert('success', `User ${userToDelete.fullName} removed from database.`);
      fetchUsers();
    } catch (err) {
      showAlert('error', err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 12 }}>
        <RefreshCw className="spin" size={24} style={{ color: 'var(--primary)' }} />
        <span>Loading database employee directory...</span>
      </div>
    );
  }

  const headers = [
    'Employee ID',
    'Full Name',
    'Email Address',
    'Department / Job Title',
    'Risk Score',
    'System Role',
    'Access Status',
    'Last Login',
    'Actions'
  ];

  return (
    <div className="content-body">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandLogo size={26} glow={true} />
            <h1 className="page-title">User Security Management</h1>
          </div>
          <p className="page-subtitle">Manage employee access privileges, adjust risk levels, and block accounts directly in MongoDB</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: '40px', padding: '0 18px' }}
        >
          <UserPlus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Alert banner */}
      {alertMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: alertMsg.type === 'success' ? 'var(--success-bg, #ecfdf5)' : 'var(--danger-bg, #fef2f2)',
            color: alertMsg.type === 'success' ? 'var(--success-text, #065f46)' : 'var(--danger-text, #991b1b)',
            border: `1px solid ${alertMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, ID, or department..."
              className="form-input"
              style={{ paddingLeft: 36, width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
              <select
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.8rem', width: '120px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <select
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.8rem', width: '120px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <button
              onClick={fetchUsers}
              className="btn btn-secondary"
              title="Refresh database records"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} className={actionLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <span>Active Employee Directory ({filteredUsers.length} of {users.length} Database Records)</span>
          </h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataTable
            headers={headers}
            data={filteredUsers}
            renderRow={(uItem) => (
              <tr key={uItem._id}>
                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{uItem.employeeId}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                      {uItem.fullName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 600 }}>{uItem.fullName}</span>
                  </div>
                </td>
                <td>{uItem.email}</td>
                <td>{uItem.department} — {uItem.jobTitle}</td>
                <td>
                  {editingRisk === uItem._id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max="100"
                        style={{ width: '64px', padding: '4px' }}
                        value={riskValue}
                        onChange={(e) => setRiskValue(e.target.value)}
                      />
                      <button onClick={() => handleSaveRisk(uItem._id)} className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingRisk(null)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        onClick={() => handleOpenRiskEdit(uItem)}
                        style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to edit risk score"
                      >
                        {uItem.riskScore}
                      </span>
                      <RiskBadge level={uItem.riskLevel} />
                    </div>
                  )}
                </td>
                <td>
                  {uItem.role === 'admin' ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                      }}
                      title="Administrator role is protected and cannot be modified"
                    >
                      <Shield size={13} />
                      <span>Admin (Protected)</span>
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: '120px' }}
                      value={uItem.role}
                      onChange={(e) => handleRoleChange(uItem._id, e.target.value)}
                      disabled={actionLoading}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  )}
                </td>
                <td>
                  {uItem.role === 'admin' ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success-text, #059669)', padding: '4px 6px' }}>
                      Active (Protected)
                    </span>
                  ) : (
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: '110px' }}
                      value={uItem.status}
                      onChange={(e) => handleStatusChange(uItem._id, e.target.value)}
                      disabled={actionLoading}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  )}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {uItem.lastLogin ? (
                    <span>
                      {new Date(uItem.lastLogin).toLocaleDateString()} {new Date(uItem.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span>Never</span>
                  )}
                </td>
                <td>
                  <div className="action-btn-group">
                    {uItem.role === 'admin' ? (
                      <span
                        className="action-btn action-btn-secondary action-btn-icon"
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        title="Administrator accounts cannot be deleted"
                      >
                        <Lock size={13} />
                      </span>
                    ) : (
                      <button
                        onClick={() => setUserToDelete(uItem)}
                        className="action-btn action-btn-danger action-btn-icon"
                        title="Delete User from Database"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Modal: Add New Employee */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="auth-logo" style={{ width: 36, height: 36 }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Add Employee to Database</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Creates a persistent user record in MongoDB</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Enterprise Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    placeholder="e.g. ramesh@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Temporary Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Default: password123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="IT Security">IT Security</option>
                    <option value="Product Development">Product</option>
                    <option value="Product Infrastructure">DevOps/Infra</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Security Analyst"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Location</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. India"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Risk Score (0-100)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.riskScore}
                    onChange={(e) => setFormData({ ...formData, riskScore: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {actionLoading ? <RefreshCw className="spin" size={16} /> : <UserPlus size={16} />}
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {userToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-card, #ffffff)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: 10, borderRadius: '50%' }}>
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Delete User Profile</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This will remove the user permanently from MongoDB</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              Are you sure you want to delete user <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn btn-danger"
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {actionLoading ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

