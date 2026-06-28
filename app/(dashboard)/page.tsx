'use client';

import PageWrapper from '@/components/PageWrapper';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TopDriversChart from '@/components/dashboard/TopDriversChart';
import TripStatusChart from '@/components/dashboard/TripStatusChart';
import RecentActivities from '@/components/dashboard/RecentActivities';
import LiveTrips from '@/components/dashboard/LiveTrips';
import DashboardReportExport from '@/components/dashboard/DashboardReportExport';
import DashboardSkeleton from '@/components/dashboard/SkeletonLoader';
import PendingTasksAlert from '@/components/dashboard/PendingTasksAlert';
import PopularRoutesChart from '@/components/dashboard/PopularRoutesChart';
import PunctualityChart from '@/components/dashboard/PunctualityChart';
import { useDashboard } from '@/hooks/useDashboard';
import { Users, Bus, MapPin, Banknote } from 'lucide-react';

// Cấu hình 4 thẻ thống kê
const statCardConfigs = [
  {
    key: 'activeStudents',
    title: 'Học sinh',
    icon: Users,
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    iconColor: 'text-white',
  },
  {
    key: 'activeBuses',
    title: 'Xe buýt đang hoạt động',
    icon: Bus,
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconColor: 'text-white',
  },
  {
    key: 'todayTrips',
    title: 'Chuyến hôm nay',
    icon: MapPin,
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
    iconColor: 'text-white',
  },
  {
    key: 'totalRevenue',
    title: 'Doanh thu',
    icon: Banknote,
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
  },
] as const;

// Dữ liệu mặc định khi API chưa sẵn sàng
const defaultStats = {
  activeStudents: 0,
  activeBuses: 0,
  todayTrips: 0,
  totalRevenue: 0,
};

// Trang Dashboard tổng quan
export default function DashboardPage() {
  const { stats, isLoading } = useDashboard();

  // Sử dụng dữ liệu từ API hoặc dữ liệu mặc định
  const displayStats = stats || defaultStats;

  // Hiển thị Skeleton loading khi đang fetch
  if (isLoading) {
    return (
      <PageWrapper>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu...
          </p>
        </div>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  // Format doanh thu sang VND
  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <PageWrapper>
      {/* Tiêu đề trang + Nút xuất báo cáo */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Xin chào! Đây là tổng quan hệ thống hôm nay.
          </p>
        </div>
        <DashboardReportExport />
      </div>

      {/* Cảnh báo công việc cần xử lý */}
      <PendingTasksAlert />

      {/* 4 Thẻ thống kê với stagger animation */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCardConfigs.map((config, index) => (
          <StatCard
            key={config.key}
            title={config.title}
            value={
              config.key === 'totalRevenue'
                ? formatRevenue(displayStats[config.key])
                : displayStats[config.key]
            }
            icon={config.icon}
            gradient={config.gradient}
            iconColor={config.iconColor}
            index={index}
          />
        ))}
      </div>

      {/* Biểu đồ doanh thu + Tỷ lệ đúng giờ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div className="xl:col-span-1">
          <PunctualityChart />
        </div>
      </div>

      {/* Top 5 Tài xế + Tuyến đường phổ biến */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopDriversChart />
        <PopularRoutesChart />
      </div>

      {/* Hoạt động gần đây + Trạng thái chuyến đi / Chuyến xe đang chạy */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <TripStatusChart />
        </div>
        <div className="xl:col-span-1">
          <LiveTrips />
        </div>
        <div className="xl:col-span-1">
          <RecentActivities />
        </div>
      </div>
    </PageWrapper>
  );
}
