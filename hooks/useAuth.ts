import { create } from 'zustand';
import { AuthUser, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';
import { setCookie, deleteCookie } from 'cookies-next'; // Thêm thư viện này

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data: LoginRequest) => {
    const response = await authService.login(data);
    const { accessToken, user } = response.data;
    
    // Kiểm tra quyền ADMIN
    if (user.role !== 'ADMIN') {
      throw new Error('Tài khoản của bạn không có quyền truy cập vào bảng điều khiển quản trị.');
    }
    
    // 1. Lưu token vào Cookie (ĐỂ MIDDLEWARE NEXT.JS ĐỌC ĐƯỢC)
    setCookie('accessToken', accessToken, { maxAge: 60 * 60 * 24 }); // Sống 1 ngày

    // 2. Lưu vào localStorage (ĐỂ ZUSTAND ĐỌC ĐƯỢC KHI F5)
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    // Xóa sạch cả Cookie lẫn LocalStorage
    deleteCookie('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  checkAuth: () => {
    try {
      // Hàm này chạy trên Client
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (error) {
       set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));