import useSWR from 'swr';
import { dashboardService } from '@/services/dashboardService';
import toast from 'react-hot-toast';
import { DashboardStats, RevenueDataPoint, TopDriver, TripStat, Activity, LiveTrip, AdminNotification } from '@/types/dashboard';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { CalendarX, CreditCard } from 'lucide-react';

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

// Hook lấy biểu đồ doanh thu (có lọc ngày tùy chọn)
export const useRevenueChart = (startDate?: string, endDate?: string) => {
  const { data, error, isLoading } = useSWR<{ data: RevenueDataPoint[] }>(
    ['/dashboard/revenue-chart', startDate, endDate],
    () => dashboardService.getRevenueChart(startDate, endDate),
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

// Hook lấy thống kê trạng thái chuyến đi
export const useTripStats = () => {
  const { data, error, isLoading } = useSWR<{ data: TripStat[] }>(
    '/dashboard/trip-stats',
    () => dashboardService.getTripStats(),
    {
      refreshInterval: 60000,
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải thống kê chuyến đi'
        );
      },
    }
  );

  return {
    tripStats: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

// Hook lấy hoạt động gần đây
export const useRecentActivities = () => {
  const { data, error, isLoading } = useSWR<{ data: Activity[] }>(
    '/dashboard/recent-activities',
    () => dashboardService.getRecentActivities(),
    {
      refreshInterval: 10000,
      onError: (err) => {
        console.error(err);
      },
    }
  );

  return {
    activities: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

// Hook lấy chuyến xe đang chạy
export const useLiveTrips = () => {
  const { data, error, isLoading } = useSWR<{ data: LiveTrip[] }>(
    '/dashboard/live-trips',
    () => dashboardService.getLiveTrips(),
    {
      refreshInterval: 10000,
      onError: (err) => {
        console.error(err);
      },
    }
  );

  return {
    liveTrips: data?.data || [],
    isLoading,
    isError: !!error,
  };
};
// Hook lấy công việc cần xử lý
export const usePendingTasks = () => {
  const { data, error, isLoading } = useSWR<{ data: { pendingLeaves: number; openSupport: number; total: number } }>(
    '/dashboard/pending-tasks',
    () => dashboardService.getPendingTasks(),
    {
      refreshInterval: 30000,
      onError: (err) => {
        console.error(err);
      },
    }
  );

  return {
    pendingTasks: data?.data || null,
    isLoading,
    isError: !!error,
  };
};

// Hook lấy top 5 tuyến đường phổ biến
export const usePopularRoutes = () => {
  const { data, error, isLoading } = useSWR<{ data: { routeId: string; routeCode: string; name: string; ticketCount: number }[] }>(
    '/dashboard/popular-routes',
    () => dashboardService.getPopularRoutes(),
    {
      refreshInterval: 60000,
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải tuyến đường phổ biến'
        );
      },
    }
  );

  return {
    popularRoutes: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

// Hook lấy thống kê tỷ lệ đúng giờ
export const usePunctualityStats = () => {
  const { data, error, isLoading } = useSWR<{ data: { date: string; onTime: number; late: number }[] }>(
    '/dashboard/punctuality',
    () => dashboardService.getPunctualityStats(),
    {
      refreshInterval: 60000,
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Lỗi khi tải thống kê đúng giờ'
        );
      },
    }
  );

  return {
    punctualityData: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

// Hook lấy thông báo Admin & logic hiển thị Toast
export const useAdminNotifications = (onNotificationClick?: (notif: AdminNotification) => void) => {
  const router = useRouter();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const { data, error, isLoading } = useSWR<{ data: AdminNotification[] }>(
    '/dashboard/admin-notifications',
    () => dashboardService.getAdminNotifications(),
    {
      refreshInterval: 3000, // Polling mỗi 3 giây
      onError: (err) => {
        console.error('Lỗi lấy thông báo:', err);
      },
    }
  );

  const notifications = data?.data || [];

  useEffect(() => {
    if (isLoading || !data?.data) return;

    const currentIds = new Set(notifications.map(n => n.id));

    // Bỏ qua lần load đầu tiên (chỉ lấy state hiện tại, không bung toast)
    if (isFirstLoad.current) {
      seenIdsRef.current = currentIds;
      isFirstLoad.current = false;
      return;
    }

    // So sánh xem có thông báo mới (ID mới) không
    const newNotifications = notifications.filter(n => !seenIdsRef.current.has(n.id));

    if (newNotifications.length > 0) {
      newNotifications.forEach(notif => {
        // Bung Toast
        toast.custom((t) => {
          const isLeave = notif.type === 'LEAVE_REQUEST';
          const Icon = isLeave ? CalendarX : CreditCard;
          const iconColor = isLeave ? 'text-orange-500 bg-orange-100' : 'text-emerald-500 bg-emerald-100';
          const targetUrl = isLeave ? '/requests/absence' : '/transactions';

          return (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors overflow-hidden`}
              onClick={() => {
                toast.dismiss(t.id);
                if (onNotificationClick) {
                  onNotificationClick(notif);
                } else {
                  router.push(targetUrl);
                }
              }}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconColor} dark:bg-opacity-20`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {notif.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {notif.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          );
        }, { duration: 5000, position: 'top-right' });
      });

      // Cập nhật lại danh sách đã xem
      seenIdsRef.current = currentIds;
    }

  }, [notifications, isLoading, router]);

  return {
    notifications,
    isLoading,
    isError: !!error,
  };
};
