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

  // Lấy thống kê trạng thái chuyến đi
  getTripStats: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosClient.get('/dashboard/trip-stats');
    return response.data;
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosClient.get('/dashboard/recent-activities');
    return response.data;
  },

  // Lấy chuyến xe đang chạy
  getLiveTrips: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosClient.get('/dashboard/live-trips');
    return response.data;
  },

  // Lấy thông báo Admin trên Header
  getAdminNotifications: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosClient.get('/dashboard/admin-notifications');
    return response.data;
  },
};
