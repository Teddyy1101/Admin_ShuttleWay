import useSWR from 'swr';
import { notificationService } from '@/services/notificationService';
import { BroadcastPayload, GetNotificationHistoryParams, Notification } from '@/types/notification';
import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';

// Hook quản lý lịch sử thông báo admin + broadcast
export const useNotifications = (initialParams?: GetNotificationHistoryParams) => {
  const [params, setParams] = useState<GetNotificationHistoryParams>(initialParams || { page: 1, limit: 20 });

  const fetchKey = ['/notifications/admin/history', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => notificationService.getHistory(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải lịch sử thông báo');
      },
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetNotificationHistoryParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Gửi thông báo broadcast
  const broadcast = async (payload: BroadcastPayload) => {
    try {
      const result = await notificationService.broadcast(payload);
      toast.success(result.message || 'Gửi thông báo thành công');
      mutate(); // Refresh lịch sử sau khi gửi
      return result;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi gửi thông báo');
      throw error;
    }
  };

  return {
    notifications: (data?.data?.data || []) as Notification[],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 20,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    broadcast,
    mutate,
  };
};
