import { create } from 'zustand';
import { AuthUser, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { setCookie, deleteCookie } from 'cookies-next'; // Thêm thư viện này

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
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

          // Fetch dữ liệu mới nhất từ server (ảnh đại diện, tên,...)
          userService.getMe()
            .then(res => {
              if (res.data) {
                const updatedUser = {
                  id: res.data.id,
                  email: res.data.email,
                  fullName: res.data.fullName,
                  role: res.data.role,
                  avatarUrl: res.data.avatarUrl === null ? undefined : res.data.avatarUrl,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                set({ user: updatedUser });
              }
            })
            .catch(err => console.error("Không thể lấy thông tin mới nhất", err));

        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (error) {
       set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<AuthUser>) => {
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      }
      return state;
    });
  },
}));