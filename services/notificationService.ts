import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Notification, BroadcastPayload, GetNotificationHistoryParams, GroupedNotification, GetGroupedNotificationParams } from '@/types/notification';

export const notificationService = {
  // Gửi thông báo broadcast (Admin only)
  broadcast: async (payload: BroadcastPayload): Promise<ApiResponse<{ totalRecipients: number; fcmSentCount: number }>> => {
    const response = await axiosClient.post('/notifications/broadcast', payload);
    return response.data;
  },

  // Lấy lịch sử thông báo (Admin only)
  getHistory: async (params?: GetNotificationHistoryParams): Promise<ApiResponse<PaginatedData<Notification>>> => {
    const response = await axiosClient.get('/notifications/admin/history', { params });
    return response.data;
  },

  // Lấy lịch sử thông báo gom nhóm theo chiến dịch (Admin only)
  getGroupedHistory: async (params?: GetGroupedNotificationParams): Promise<ApiResponse<PaginatedData<GroupedNotification>>> => {
    const response = await axiosClient.get('/notifications/admin/history/grouped', { params });
    return response.data;
  },
};

