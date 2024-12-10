import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',  // 添加基础 URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 对于 multipart/form-data 请求（如文件上传），不设置 Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
