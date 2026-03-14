import axiosClient from '@/lib/axiosClient';
import { ApiResponse } from '@/types/api';
import { DashboardStats } from '@/types/dashboard';

// Service gọi API thống kê Dashboard
export const dashboardService = {
  // Lấy dữ liệu thống kê tổng quan
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axiosClient.get('/dashboard/overview');
    return response.data;
  },
};
