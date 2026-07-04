import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};



export const assignmentApi = {
  byCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  create: (data) => api.post('/assignments', data),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  submissions: (id) => api.get(`/assignments/${id}/submissions`),
  grade: (subId, data) => api.put(`/assignments/submissions/${subId}/grade`, data),
  aiGrade: (subId) => api.post(`/assignments/submissions/${subId}/ai-grade`),
};






export const aiApi = {
  chats: () => api.get('/ai/chats'),
  getChat: (id) => api.get(`/ai/chats/${id}`),
  send: (data) => api.post('/ai/chat', data),
  generate: (mode, prompt) => api.post('/ai/generate', { mode, prompt }),
  deleteChat: (id) => api.delete(`/ai/chats/${id}`),
};

export const ragApi = {
  upload: (data) => api.post('/rag/upload', data),
  documents: () => api.get('/rag/documents'),
  ask: (data) => api.post('/rag/ask', data),
  remove: (id) => api.delete(`/rag/documents/${id}`),
};




export const adminApi = {
  stats: () => api.get('/admin/stats'),
  aiAnalytics: () => api.get('/admin/ai-analytics'),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  updateMe: (data) => api.put('/users/me/update', data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  remove: (id) => api.delete(`/users/${id}`),
};
