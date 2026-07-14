let API_URL = import.meta.env.VITE_API_URL || '/api';
if (API_URL.startsWith('http') && !API_URL.endsWith('/api') && !API_URL.includes('/api/')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

/**
 * Helper to fetch with auth headers and automatic JSON parsing.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mediscan_token');
  
  const headers = {
    ...options.headers,
  };

  // If sending JSON data, add headers
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth API
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  googleOAuth: (oauthData) => request('/auth/google-oauth', {
    method: 'POST',
    body: JSON.stringify(oauthData),
  }),

  verifyOTP: (otpData) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(otpData),
  }),

  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  getGoogleConfig: () => request('/auth/google-config'),

  // User Dashboard & Profiles
  getProfile: () => request('/user/profile'),
  updateProfile: (profileData) => request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  getDashboardStats: () => request('/user/dashboard'),
  getScans: (search = '') => request(`/user/scans?search=${encodeURIComponent(search)}`),
  getReports: (search = '') => request(`/user/reports?search=${encodeURIComponent(search)}`),
  deleteScan: (id) => request(`/user/scans/${id}`, { method: 'DELETE' }),
  deleteReport: (id) => request(`/user/reports/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/user/history/clear', { method: 'DELETE' }),

  // Scanning & Analytics File Uploads
  scanMedicine: (formData) => request('/scan', {
    method: 'POST',
    body: formData, // FormData contains 'image' file
  }),

  analyzeReport: (formData) => request('/report', {
    method: 'POST',
    body: formData, // FormData contains 'file' file
  }),
};
