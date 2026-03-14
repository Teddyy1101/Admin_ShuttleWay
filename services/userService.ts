import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { User, GetUsersParams } from '@/types/user';

export const userService = {
  // Lấy danh sách tài khoản có phân trang và lọc
  getUsers: async (params?: GetUsersParams): Promise<ApiResponse<PaginatedData<User>>> => {
    const response = await axiosClient.get('/users', { params });
    return response.data;
  },

  // Lấy thông tin chi tiết một tài khoản
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await axiosClient.get(`/users/${id}`);
    return response.data;
  },

  // Khóa / Mở khóa tài khoản
  updateUserStatus: async (id: string, isActive: boolean): Promise<ApiResponse<User>> => {
    const response = await axiosClient.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  // Xóa tài khoản
  deleteUser: async (id: string): Promise<ApiResponse<boolean>> => {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },
};
