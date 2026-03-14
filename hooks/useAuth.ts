import { create } from 'zustand';
import { AuthUser, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';

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
    
    // Lưu token vào localStorage
    localStorage.setItem('accessToken', accessToken);
    // Lưu user vào store
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  checkAuth: () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
       set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
