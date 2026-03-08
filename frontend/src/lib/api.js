import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const apiClient = axios.create({
  baseURL: API,
  withCredentials: true
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const api = {
  // Auth
  getMe: () => apiClient.get('/auth/me'),
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  processSession: (sessionId) => apiClient.post('/auth/session', { session_id: sessionId }),

  // Helpers
  getHelpers: (params) => apiClient.get('/helpers', { params }),
  getHelper: (helperId) => apiClient.get(`/helpers/${helperId}`),
  createHelperProfile: (data) => apiClient.post('/helpers/profile', data),
  updateHelperProfile: (data) => apiClient.put('/helpers/profile', data),
  getMyHelperProfile: () => apiClient.get('/helpers/me/profile'),

  // Jobs
  getJobs: (params) => apiClient.get('/jobs', { params }),
  getJob: (jobId) => apiClient.get(`/jobs/${jobId}`),
  createJob: (data) => apiClient.post('/jobs', data),
  getMyJobs: () => apiClient.get('/jobs/user/my-jobs'),

  // Bookings
  getBookings: () => apiClient.get('/bookings'),
  getBooking: (bookingId) => apiClient.get(`/bookings/${bookingId}`),
  createBooking: (data) => apiClient.post('/bookings', data),
  getHelperBookings: () => apiClient.get('/bookings/helper'),
  updateBookingStatus: (bookingId, data) => apiClient.put(`/bookings/${bookingId}/status`, data),

  // Reviews
  getHelperReviews: (helperId, params) => apiClient.get(`/reviews/helper/${helperId}`, { params }),
  createReview: (data) => apiClient.post('/reviews', data),

  // Messages
  getConversations: () => apiClient.get('/conversations'),
  createConversation: (otherUserId, bookingId) => apiClient.post('/conversations', null, { params: { other_user_id: otherUserId, booking_id: bookingId } }),
  getMessages: (conversationId) => apiClient.get(`/messages/${conversationId}`),
  sendMessage: (data) => apiClient.post('/messages', data),

  // Payments
  createCheckout: (data) => apiClient.post('/payments/checkout', data),
  getPaymentStatus: (sessionId) => apiClient.get(`/payments/status/${sessionId}`),

  // Admin Payments
  getAdminPayments: (params) => apiClient.get('/admin/payments', { params }),
  getAdminPaymentDetail: (transactionId) => apiClient.get(`/admin/payments/${transactionId}`),
  releasePayment: (transactionId) => apiClient.post(`/admin/payments/${transactionId}/release`),
  refundPayment: (transactionId) => apiClient.post(`/admin/payments/${transactionId}/refund`),

  // Helper Earnings
  getHelperEarnings: () => apiClient.get('/helper/earnings'),
  getHelperPayouts: () => apiClient.get('/helper/payouts'),

  // Categories
  getCategories: () => apiClient.get('/categories'),
  getSeasonalPricing: () => apiClient.get('/pricing/seasonal'),
  getCategoryPricing: (categoryId) => apiClient.get(`/pricing/category/${categoryId}`),

  // Featured Helpers
  getFeaturedHelpers: (limit = 6) => apiClient.get('/helpers/featured', { params: { limit } }),

  // Notifications
  getNotifications: (unreadOnly = false) => apiClient.get('/notifications', { params: { unread_only: unreadOnly } }),
  markNotificationRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => apiClient.put('/notifications/read-all'),

  // Reviews
  createReview: (data) => apiClient.post('/reviews', data),
  getHelperReviews: (helperId, params) => apiClient.get(`/reviews/helper/${helperId}`, { params }),

  // Reports
  reportUser: (data) => apiClient.post('/reports', data),

  // Admin Reports
  getAdminReports: (params) => apiClient.get('/admin/reports', { params }),
  getAdminBookings: (params) => apiClient.get('/admin/bookings', { params }),
  getAdminVerifications: () => apiClient.get('/admin/verifications'),
  getVerificationDetail: (verificationId) => apiClient.get(`/admin/verifications/${verificationId}`),
  updateVerificationStatus: (verificationId, data) => apiClient.put(`/admin/verifications/${verificationId}`, data),

  // Admin Dashboard
  getAdminDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getAdminActivity: (limit = 20) => apiClient.get('/admin/dashboard/activity', { params: { limit } }),
  getAdminChartData: (days = 7) => apiClient.get('/admin/dashboard/charts', { params: { days } }),

  // Admin User Management
  getAdminUsers: (params) => apiClient.get('/admin/users', { params }),
  getAdminUserDetail: (userId) => apiClient.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, action, reason) => apiClient.put(`/admin/users/${userId}/status`, null, { params: { action, reason } }),

  // Admin Job Management
  getAdminJobs: (params) => apiClient.get('/admin/jobs', { params }),
  getAdminJobDetail: (jobId) => apiClient.get(`/admin/jobs/${jobId}`),
  updateJobStatus: (jobId, status, reason) => apiClient.put(`/admin/jobs/${jobId}/status`, null, { params: { status, reason } }),
  deleteJob: (jobId) => apiClient.delete(`/admin/jobs/${jobId}`),

  // Verification
  submitVerification: (data) => apiClient.post('/verification/submit', data),
  getVerificationStatus: () => apiClient.get('/verification/status'),

  // Seed data
  seedData: () => apiClient.post('/seed-data')
};

export default api;
