import axios from 'axios';

// Tạo Axios instance với baseURL từ biến môi trường
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động gắn Bearer Token vào header
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Bắt lỗi 401 để tự động logout
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const requestUrl = error.config?.url || '';
        const isLoginRequest = requestUrl.includes('/auth/login');
        const isOnLoginPage = window.location.pathname === '/login';

        // Không redirect nếu đang gọi API login hoặc đang ở trang login
        if (isLoginRequest || isOnLoginPage) {
          return Promise.reject(error);
        }

        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
