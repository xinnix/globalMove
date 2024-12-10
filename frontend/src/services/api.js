import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证相关 API
export const auth = {
  login: (credentials) => api.post('/v1/users/login', credentials),
  register: (userData) => api.post('/v1/users/register', userData),
  getProfile: () => api.get('/v1/users/me'),
  updateProfile: (data) => api.patch('/v1/users/me', data),
};

// 笔记相关 API
export const notes = {
  create: (data) => api.post('/v1/notes', data),
  getAll: () => api.get('/v1/notes'),
  update: (id, data) => api.patch(`/v1/notes/${id}`, data),
  delete: (id) => api.delete(`/v1/notes/${id}`),
};

// 翻译相关 API
export const translate = {
  text: (data) => api.post('/v1/translate', data),
  generateAudio: (data) => api.post('/v1/tts', data),
};

export default api;
