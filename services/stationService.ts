import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { CreateStationPayload, GetStationsParams, Station, UpdateStationPayload } from '@/types/route';

export const stationService = {
  // Lấy danh sách trạm dừng có phân trang và lọc
  getStations: async (params?: GetStationsParams): Promise<ApiResponse<PaginatedData<Station>>> => {
    const response = await axiosClient.get('/stations', { params });
    return response.data;
  },

  // Tạo trạm dừng mới
  createStation: async (payload: CreateStationPayload): Promise<Station> => {
    const response = await axiosClient.post('/stations', payload);
    return response.data;
  },

  // Cập nhật thông tin trạm dừng
  updateStation: async (id: string, payload: UpdateStationPayload): Promise<Station> => {
    const response = await axiosClient.patch(`/stations/${id}`, payload);
    return response.data;
  },

  // Bật/Tắt trạng thái hoạt động trạm dừng
  toggleStationStatus: async (id: string): Promise<void> => {
    await axiosClient.patch(`/stations/${id}/toggle-status`);
  },

  // Xóa trạm dừng (xóa mềm)
  deleteStation: async (id: string): Promise<void> => {
    await axiosClient.delete(`/stations/${id}`);
  },
};
