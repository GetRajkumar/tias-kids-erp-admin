import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const adminTenantId = localStorage.getItem('adminSelectedTenantId');
  if (adminTenantId) config.headers['X-Tenant-Id'] = adminTenantId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string, tenantSlug?: string) =>
    api.post('/auth/login', { email, password, tenantSlug }),
  selectTenant: (tenantSlug: string) =>
    api.post('/auth/select-tenant', { tenantSlug }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Tenant API
export const tenantApi = {
  getAll: () => api.get('/tenants'),
  getById: (id: string) => api.get(`/tenants/${id}`),
  getBySlug: (slug: string) => api.get(`/tenants/by-slug/${slug}`),
  getMyTenants: () => api.get('/tenants/my-tenants'),
  getSettings: () => api.get('/tenants/settings'),
  updateMySettings: (data: any) => api.patch('/tenants/my-settings', data),
  create: (data: any) => api.post('/tenants', data),
  update: (id: string, data: any) => api.patch(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
  getSettingsById: (id: string) => api.get(`/tenants/${id}/settings`),
  updateSettingsById: (id: string, data: any) => api.patch(`/tenants/${id}/settings`, data),
  getUsers: () => api.get('/tenants/users'),
  addUser: (data: any) => api.post('/tenants/users', data),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/tenants/users/${userId}/role`, { role }),
  removeUser: (userId: string) => api.delete(`/tenants/users/${userId}`),
};

export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const admissionsApi = {
  getAll: (status?: string) => api.get('/admissions', { params: { status } }),
  getById: (id: string) => api.get(`/admissions/${id}`),
  create: (data: any) => api.post('/admissions', data),
  createForTenant: (tenantSlug: string, data: any) =>
    api.post(`/admissions/tenant/${tenantSlug}`, data),
  approve: (id: string) => api.post(`/admissions/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/admissions/${id}/reject`, { reason }),
  updateStatus: (id: string, status: string, comment: string) =>
    api.post(`/admissions/${id}/update-status`, { status, comment }),
  getComments: (id: string) => api.get(`/admissions/${id}/comments`),
  addComment: (id: string, comment: string) => api.post(`/admissions/${id}/add-comment`, { comment }),
};

export const attendanceApi = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  create: (data: any) => api.post('/attendance', data),
  createBulk: (data: any) => api.post('/attendance/bulk', data),
};

export const paymentsApi = {
  getAll: (status?: string) => api.get('/payments', { params: { status } }),
  create: (data: any) => api.post('/payments', data),
  markComplete: (id: string, transactionId: string, paymentMethod: string) =>
    api.post(`/payments/${id}/complete`, { transactionId, paymentMethod }),
};

export const paymentSchedulesApi = {
  getAll: (academicYear?: string) => api.get('/payment-schedules', { params: { academicYear } }),
  getById: (id: string) => api.get(`/payment-schedules/${id}`),
  create: (data: any) => api.post('/payment-schedules', data),
  update: (id: string, data: any) => api.patch(`/payment-schedules/${id}`, data),
  getByStudent: (studentId: string) => api.get(`/payment-schedules/student/${studentId}`),
  getStudentSummary: (studentId: string) => api.get(`/payment-schedules/student/${studentId}/summary`),
  getByParent: (parentId: string) => api.get(`/payment-schedules/parent/${parentId}`),
  getOverdue: () => api.get('/payment-schedules/overdue'),
  recordPayment: (data: any) => api.post('/payment-schedules/record-payment', data),
  sendReminder: (scheduleId: string, installmentNumber: number) =>
    api.post(`/payment-schedules/${scheduleId}/send-reminder`, { installmentNumber }),
  // Advance Payment APIs
  createAdvancePayment: (data: any) => api.post('/payment-schedules/advance-payment', data),
  getAllAdvancePayments: () => api.get('/payment-schedules/advance-payment'),
  getAdvancePaymentsByStudent: (studentId: string) => 
    api.get(`/payment-schedules/advance-payment/student/${studentId}`),
  getUnusedAdvancePayment: (studentId: string) => 
    api.get(`/payment-schedules/advance-payment/student/${studentId}/unused`),
};

export const ticketsApi = {
  getAll: (status?: string) => api.get('/tickets', { params: { status } }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  update: (id: string, data: any) => api.patch(`/tickets/${id}`, data),
  addMessage: (id: string, message: string) => api.post(`/tickets/${id}/messages`, { message }),
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getStudentsByClass: () => api.get('/reports/students-by-class'),
};

export const homeworkApi = {
  getByClass: (className: string, params?: any) => api.get(`/homework/class/${className}`, { params }),
  getById: (id: string) => api.get(`/homework/${id}`),
  create: (data: any) => api.post('/homework', data),
  update: (id: string, data: any) => api.patch(`/homework/${id}`, data),
  delete: (id: string) => api.delete(`/homework/${id}`),
  grade: (id: string, studentId: string, data: any) => api.post(`/homework/${id}/grade/${studentId}`, data),
};

export const announcementsApi = {
  getAll: () => api.get('/announcements'),
  getById: (id: string) => api.get(`/announcements/${id}`),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};
