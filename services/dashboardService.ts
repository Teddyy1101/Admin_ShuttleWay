import axiosClient from '@/lib/axiosClient';
import { ApiResponse } from '@/types/api';
import { DashboardStats, RevenueDataPoint, TopDriver } from '@/types/dashboard';

// Service gọi API thống kê Dashboard
export const dashboardService = {
  // Lấy dữ liệu thống kê tổng quan
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axiosClient.get('/dashboard/overview');
    return response.data;
  },

  // Lấy biểu đồ doanh thu 7 ngày
  getRevenueChart: async (): Promise<ApiResponse<RevenueDataPoint[]>> => {
    const response = await axiosClient.get('/dashboard/revenue-chart');
    return response.data;
  },

  // Lấy top 5 tài xế
  getTopDrivers: async (): Promise<ApiResponse<TopDriver[]>> => {
    const response = await axiosClient.get('/dashboard/top-drivers');
    return response.data;
  },
};
