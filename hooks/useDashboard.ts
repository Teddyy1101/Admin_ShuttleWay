import useSWR from 'swr';
import { dashboardService } from '@/services/dashboardService';
import toast from 'react-hot-toast';
import { DashboardStats, RevenueDataPoint, TopDriver } from '@/types/dashboard';

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

// Hook lấy biểu đồ doanh thu 7 ngày
export const useRevenueChart = () => {
  const { data, error, isLoading } = useSWR<{ data: RevenueDataPoint[] }>(
    '/dashboard/revenue-chart',
    () => dashboardService.getRevenueChart(),
    {
      refreshInterval: 60000, // Refresh mỗi 60 giây
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải biểu đồ doanh thu'
        );
      },
    }
  );

  return {
    revenueData: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

// Hook lấy top 5 tài xế
export const useTopDrivers = () => {
  const { data, error, isLoading } = useSWR<{ data: TopDriver[] }>(
    '/dashboard/top-drivers',
    () => dashboardService.getTopDrivers(),
    {
      refreshInterval: 60000,
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải top tài xế'
        );
      },
    }
  );

  return {
    topDrivers: data?.data || [],
    isLoading,
    isError: !!error,
  };
};
