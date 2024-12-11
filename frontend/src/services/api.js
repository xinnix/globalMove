import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器：添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 如果是 FormData，不要设置 Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
    if (error.response) {
      // 处理 401 错误
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
      // 返回错误信息
      const errorMessage = error.response.data.error || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(new Error('Network error'));
  }
);

// 认证相关 API
const auth = {
  login: (data) => api.post('/users/login', data),
  register: (data) => api.post('/users/register', data),
  getProfile: () => api.get('/users/profile'),
};

// 笔记相关 API
const notes = {
  create: (data) => api.post('/notes', data),
  list: () => api.get('/notes'),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// 练习相关 API
const practices = {
  create: (data) => api.post('/practices', data),
  list: () => api.get('/practices'),
};

// 活动相关 API
const activities = {
  list: () => api.get('/activities'),
  create: (data) => api.post('/activities', data),
};

export {
  auth,
  notes,
  practices,
  activities,
};
