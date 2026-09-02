const BASE_URL = 'http://localhost:5000/api';

/**
 * Enhanced fetch wrapper that injects authentication token
 * and simulated Zero Trust client headers.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Retrieve simulated headers from localStorage (set in user Profile/Security tab)
  const deviceId = localStorage.getItem('sim_device_id') || 'dev-trusted-sai-win';
  const deviceName = localStorage.getItem('sim_device_name') || 'Chrome 124 on Windows 11';
  const simulatedIp = localStorage.getItem('sim_ip') || '192.168.1.10';
  const country = localStorage.getItem('sim_country') || 'India';
  const city = localStorage.getItem('sim_city') || 'Mumbai';
  const mfaVerified = localStorage.getItem('sim_mfa_verified') || 'false';

  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    'x-device-name': deviceName,
    'x-simulated-ip': simulatedIp,
    'x-location-country': country,
    'x-location-city': city,
    'x-mfa-verified': mfaVerified,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or invalid token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

/**
 * Enhanced file upload wrapper for multipart/form-data
 */
export const apiUpload = async (endpoint, formData) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    // Session expired or invalid token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired or user not found. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'File upload failed');
  }

  return data;
};
