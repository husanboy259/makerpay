import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:           (data: any)  => api.post('/auth/login', data),
  register:        (data: any)  => api.post('/auth/register', data),
  verifyOtp:       (email: string, code: string) => api.post('/auth/verify-otp', { email, code }),
  resendOtp:       (email: string) => api.post('/auth/resend-otp', { email }),
  getProfile:      ()           => api.get('/auth/me'),
  updateProfile:   (data: any)  => api.put('/auth/profile', data),
  changePassword:  (data: any)  => api.post('/auth/change-password', data),
  telegramLogin:   (data: any)  => api.post('/auth/telegram', data),
  forgotPassword:  (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword:   (data: { email: string; otp: string; newPassword: string }) => api.post('/auth/reset-password', data),
};

// ─── Merchants ────────────────────────────────────────────────────────────────
export const merchantsApi = {
  create:       (data: any)           => api.post('/merchants', data),
  getMe:        ()                    => api.get('/merchants/me'),
  update:       (data: any)           => api.put('/merchants/me', data),
  getAll:       (params?: any)        => api.get('/merchants', { params }),
  getById:      (id: string)          => api.get(`/merchants/${id}`),
  approve:      (id: string)          => api.post(`/merchants/${id}/approve`),
  suspend:      (id: string, reason: string) => api.post(`/merchants/${id}/suspend`, { reason }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  create:   (data: any)          => api.post('/payments/create', data),
  getAll:   (params?: any)       => api.get('/payments', { params }),
  getStats: ()                   => api.get('/payments/stats'),
  getChart: ()                   => api.get('/payments/chart'),
  getById:  (id: string)         => api.get(`/payments/${id}`),
  refund:   (id: string, data: any) => api.post(`/payments/${id}/refund`, data),
};

// ─── Providers ────────────────────────────────────────────────────────────────
export const providersApi = {
  connect:        (data: any)             => api.post('/providers/connect', data),
  activate:       (providerName: string)  => api.post(`/providers/activate/${providerName}`),
  getAll:         ()                      => api.get('/providers'),
  update:         (id: string, data: any) => api.put(`/providers/${id}`, data),
  disconnect:     (id: string)            => api.delete(`/providers/${id}`),
  test:           (id: string)            => api.post(`/providers/${id}/test`),
  createApiKey:   (data: any)             => api.post('/providers/api-keys', data),
  getApiKeys:     ()                      => api.get('/providers/api-keys'),
  revokeApiKey:   (id: string)            => api.delete(`/providers/api-keys/${id}`),
  // Admin ecosystem
  adminGetEcosystem:    ()               => api.get('/providers/admin/ecosystem'),
  adminPause:           (name: string)   => api.post(`/providers/admin/ecosystem/${name}/pause`),
  adminResume:          (name: string)   => api.post(`/providers/admin/ecosystem/${name}/resume`),
};

// ─── Markets ──────────────────────────────────────────────────────────────────
export const marketsApi = {
  getAll:        ()                      => api.get('/markets'),
  create:        (data: any)             => api.post('/markets', data),
  update:        (id: string, data: any) => api.put(`/markets/${id}`, data),
  delete:        (id: string)            => api.delete(`/markets/${id}`),
  adminGetAll:   ()                      => api.get('/markets/admin/all'),
  adminApprove:  (id: string)            => api.post(`/markets/admin/${id}/approve`),
  adminReject:   (id: string)            => api.post(`/markets/admin/${id}/reject`),
};

// ─── Storage ──────────────────────────────────────────────────────────────────
export const storageApi = {
  getStats:   ()                    => api.get('/storage/stats'),
  getFiles:   ()                    => api.get('/storage/files'),
  upload:     (file: File)          => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/storage/upload', form);
  },
  deleteFile: (id: string)          => api.delete(`/storage/files/${id}`),
  // Workspace / deploy
  getWorkspace:      ()             => api.get('/storage/workspace'),
  uploadLocal:       (file: File)   => { const f = new FormData(); f.append('file', file); return api.post('/storage/workspace/upload', f); },
  uploadZip:         (file: File)   => { const f = new FormData(); f.append('file', file); return api.post('/storage/workspace/upload-zip', f); },
  exec:              (command: string) => api.post('/storage/workspace/exec', { command }),
  deleteWorkspaceFile: (path: string) => api.delete('/storage/workspace/files', { data: { path } }),
  // Buckets
  getBuckets:        ()                       => api.get('/storage/buckets'),
  createBucket:      (name: string)           => api.post('/storage/buckets', { name }),
  deleteBucket:      (id: string)             => api.delete(`/storage/buckets/${id}`),
  regenerateBucketKey: (id: string)           => api.post(`/storage/buckets/${id}/regenerate`),
  // Bucket tokens
  listBucketTokens:  (id: string)             => api.get(`/storage/buckets/${id}/tokens`),
  addBucketToken:    (id: string, name: string) => api.post(`/storage/buckets/${id}/tokens`, { name }),
  deleteBucketToken: (id: string, tokenId: string) => api.delete(`/storage/buckets/${id}/tokens/${tokenId}`),
  // Bucket domain
  updateBucketDomain: (id: string, customDomain: string) => api.patch(`/storage/buckets/${id}/domain`, { customDomain }),
};

// ─── Webhooks ─────────────────────────────────────────────────────────────────
export const webhooksApi = {
  getLogs: (params?: any) => api.get('/webhooks/logs', { params }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats:         ()          => api.get('/admin/stats'),
  getPayments:      (params?: any) => api.get('/admin/payments', { params }),
  getUsers:         (params?: any) => api.get('/admin/users', { params }),
  getUserById:      (id: string)   => api.get(`/admin/users/${id}`),
  updateUserRole:   (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  banUser:          (id: string)   => api.patch(`/admin/users/${id}/ban`),
  unbanUser:        (id: string)   => api.patch(`/admin/users/${id}/unban`),
  getUserLogs:      (id: string)   => api.get(`/admin/users/${id}/logs`),
  getErrors:        (params?: any) => api.get('/admin/errors', { params }),
  getWebhookErrors: (params?: any) => api.get('/admin/webhook-errors', { params }),
  getRevenueChart:  (days?: number) => api.get('/admin/revenue-chart', { params: { days } }),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportApi = {
  createTicket:  (data: any)                       => api.post('/support/tickets', data),
  getTickets:    (params?: any)                    => api.get('/support/tickets', { params }),
  getTicket:     (id: string)                      => api.get(`/support/tickets/${id}`),
  reply:         (id: string, data: any)           => api.post(`/support/tickets/${id}/reply`, data),
  updateStatus:  (id: string, status: string)      => api.patch(`/support/tickets/${id}/status`, { status }),
  assign:        (id: string, userId: string)      => api.patch(`/support/tickets/${id}/assign`, { userId }),
};

export default api;
