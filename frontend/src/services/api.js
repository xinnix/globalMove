import axios from 'axios';

const API_URL = '/api';  // 使用相对路径，让代理处理

// 创建 axios 实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const auth = {
  login: (credentials) => api.post('/v1/users/login', credentials),
  register: (userData) => api.post('/v1/users/register', userData),
  getProfile: () => api.get('/v1/users/me'),
  getActivities: () => api.get('/v1/users/activities')
};

// 笔记相关 API
export const notes = {
  create: (data) => api.post('/v1/notes', data),
  list: () => api.get('/v1/notes'),
  update: (id, data) => api.patch(`/v1/notes/${id}`, data),
  delete: (id) => api.delete(`/v1/notes/${id}`)
};

// 翻译相关 API
export const translate = {
  text: (data) => api.post('/v1/translate', data),
  generateAudio: (data) => api.post('/v1/tts', data),
};

// 活动相关 API
export const activities = {
  list: () => api.get('/v1/activities'),
  create: (data) => api.post('/v1/activities', data)
};

// 练习相关 API
export const practices = {
  create: (data) => api.post('/v1/practices', data),
  list: () => api.get('/v1/practices')
};

// TTS 相关 API
export const tts = {
  generate: (data) => api.post('/v1/tts', data)
};

export default {
  auth,
  notes,
  translate,
  activities,
  practices,
  tts
};
