import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Bus, GetBusesParams, CreateBusPayload, UpdateBusPayload } from '@/types/bus';

export const busService = {
  // Lấy danh sách xe buýt có phân trang và lọc
  getBuses: async (params?: GetBusesParams): Promise<ApiResponse<PaginatedData<Bus>>> => {
    const response = await axiosClient.get('/buses', { params });
    return response.data;
  },

  // Lấy thông tin chi tiết một xe buýt
  getBusById: async (id: string): Promise<ApiResponse<Bus>> => {
    const response = await axiosClient.get(`/buses/${id}`);
    return response.data;
  },

  // Khóa / Mở khóa hoạt động của xe buýt
  // (Đường dẫn có thể thay đổi tùy thuộc vào cách bạn thiết kế Backend: `/buses/${id}/status` hoặc `/buses/${id}/toggle-active`)
  toggleBusStatus: async (id: string): Promise<ApiResponse<Bus>> => {
    const response = await axiosClient.patch(`/buses/${id}/toggle-active`);
    return response.data;
  },

  // Xóa xe buýt
  deleteBus: async (id: string): Promise<ApiResponse<boolean>> => {
    const response = await axiosClient.delete(`/buses/${id}`);
    return response.data;
  },

  // Thêm mới xe buýt (Sử dụng object payload thay vì FormData vì module xe không có upload ảnh)
  createBus: async (data: CreateBusPayload): Promise<ApiResponse<Bus>> => {
    const response = await axiosClient.post('/buses', data);
    return response.data;
  },

  // Cập nhật thông tin xe buýt
  updateBus: async (id: string, data: UpdateBusPayload): Promise<ApiResponse<Bus>> => {
    const response = await axiosClient.patch(`/buses/${id}`, data);
    return response.data;
  },
};