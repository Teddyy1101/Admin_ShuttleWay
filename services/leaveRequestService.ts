import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { LeaveRequest, GetLeaveRequestsParams, LeaveStatus } from '@/types/leaveRequest';

export const leaveRequestService = {
  // Lấy danh sách đơn xin nghỉ có phân trang, lọc theo trạng thái, tìm kiếm...
  getLeaveRequests: async (params?: GetLeaveRequestsParams): Promise<ApiResponse<PaginatedData<LeaveRequest>>> => {
    const response = await axiosClient.get('/leave-requests', { params });
    return response.data;
  },

  // Cập nhật trạng thái đơn xin nghỉ (Duyệt hoặc Từ chối)
  updateStatus: async (id: string, status: LeaveStatus): Promise<ApiResponse<LeaveRequest>> => {
    const response = await axiosClient.patch(`/leave-requests/${id}/status`, { status });
    return response.data;
  },
};
