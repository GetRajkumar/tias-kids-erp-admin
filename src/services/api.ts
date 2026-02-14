import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const admissionsApi = {
  getAll: (status?: string) => api.get('/admissions', { params: { status } }),
  getById: (id: string) => api.get(`/admissions/${id}`),
  create: (data: any) => api.post('/admissions', data),
  approve: (id: string) => api.post(`/admissions/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/admissions/${id}/reject`, { reason }),
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
