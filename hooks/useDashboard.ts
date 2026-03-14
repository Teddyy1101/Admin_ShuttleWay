import useSWR from 'swr';
import { dashboardService } from '@/services/dashboardService';
import toast from 'react-hot-toast';
import { DashboardStats } from '@/types/dashboard';

// Custom hook quản lý dữ liệu Dashboard
export const useDashboard = () => {
  const { data, error, isLoading, mutate } = useSWR<{ data: DashboardStats }>(
    '/dashboard/stats',
    () => dashboardService.getStats(),
    {
      // Tự động refresh mỗi 30 giây
      refreshInterval: 30000,
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê'
        );
      },
    }
  );

  return {
    stats: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
};
