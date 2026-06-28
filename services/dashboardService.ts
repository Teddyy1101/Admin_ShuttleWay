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

  // Lấy biểu đồ doanh thu (có lọc ngày tùy chọn)
  getRevenueChart: async (startDate?: string, endDate?: string): Promise<ApiResponse<RevenueDataPoint[]>> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosClient.get('/dashboard/revenue-chart', { params });
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

  // Lấy công việc cần xử lý
  getPendingTasks: async (): Promise<ApiResponse<{ pendingLeaves: number; openSupport: number; total: number }>> => {
    const response = await axiosClient.get('/dashboard/pending-tasks');
    return response.data;
  },

  // Lấy top 5 tuyến đường phổ biến
  getPopularRoutes: async (): Promise<ApiResponse<{ routeId: string; routeCode: string; name: string; ticketCount: number }[]>> => {
    const response = await axiosClient.get('/dashboard/popular-routes');
    return response.data;
  },

  // Lấy thống kê tỷ lệ đúng giờ
  getPunctualityStats: async (): Promise<ApiResponse<{ date: string; onTime: number; late: number }[]>> => {
    const response = await axiosClient.get('/dashboard/punctuality');
    return response.data;
  },
};
