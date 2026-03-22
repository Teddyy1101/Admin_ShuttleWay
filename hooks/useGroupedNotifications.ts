import useSWR from 'swr';
import { notificationService } from '@/services/notificationService';
import { GroupedNotification, GetGroupedNotificationParams } from '@/types/notification';
import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';

// Hook quản lý lịch sử thông báo gom nhóm theo chiến dịch
export const useGroupedNotifications = (initialParams?: GetGroupedNotificationParams) => {
  const [params, setParams] = useState<GetGroupedNotificationParams>(initialParams || { page: 1, limit: 10 });

  const fetchKey = ['/notifications/admin/history/grouped', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => notificationService.getGroupedHistory(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải lịch sử thông báo');
      },
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetGroupedNotificationParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  return {
    campaigns: (data?.data?.data || []) as GroupedNotification[],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    mutate,
  };
};
