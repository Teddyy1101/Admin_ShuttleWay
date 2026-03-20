import axiosClient from '@/lib/axiosClient';
import { AdminAttendancePayload, GetTripsParams, TripDetail, TripListItem } from '@/types/trip';

// Interface response từ Backend cho danh sách chuyến đi (sau khi qua TransformInterceptor)
interface TripsResponse {
  statusCode: number;
  message: string;
  data: {
    data: TripListItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const tripService = {
  // Lấy danh sách chuyến đi có phân trang và lọc
  getTrips: async (params?: GetTripsParams): Promise<TripsResponse> => {
    const response = await axiosClient.get('/trips', { params });
    return response.data;
  },

  // Lấy chi tiết chuyến đi kèm danh sách điểm danh (ADMIN) — response qua TransformInterceptor
  getTripDetail: async (id: string): Promise<{ statusCode: number; message: string; data: TripDetail }> => {
    const response = await axiosClient.get(`/trips/${id}/detail`);
    return response.data;
  },

  // Cập nhật thông tin chuyến đi (đổi xe/tài xế)
  updateTrip: (id: string, data: {
    routeId?: string;
    busId?: string;
    driverId?: string;
    direction?: string;
    scheduledDate?: string;
    startTime?: string;
    status?: string;
  }) => {
    return axiosClient.patch(`/trips/${id}`, data);
  },

  // Admin điểm danh thủ công cho học sinh
  adminUpdateAttendance: async (tripId: string, data: AdminAttendancePayload) => {
    const response = await axiosClient.patch(`/trips/${tripId}/admin-attendance`, data);
    return response.data;
  },

  // Admin kết thúc chuyến đi thủ công
  adminCompleteTrip: async (id: string) => {
    const response = await axiosClient.patch(`/trips/${id}/admin-complete`);
    return response.data;
  },

  // Admin hủy chuyến đi đột xuất
  adminCancelTrip: async (id: string) => {
    const response = await axiosClient.patch(`/trips/${id}/admin-cancel`);
    return response.data;
  },

  // Xóa chuyến đi (xóa mềm)
  deleteTrip: (id: string) => {
    return axiosClient.delete(`/trips/${id}`);
  },
};
