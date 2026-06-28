'use client';

import { useState } from 'react';
import { FileText, X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDashboardPDF, ReportConfig, ReportData } from '@/lib/generateDashboardPDF';
import { useDashboard, useTripStats, useTopDrivers, usePopularRoutes } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { dashboardService } from '@/services/dashboardService';
import { useDashboardFilter } from '@/hooks/useDashboardFilter';
import toast from 'react-hot-toast';

// Helper: format Date thành ISO string cho API
function toISODateString(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

// Cấu hình mặc định cho báo cáo
const DEFAULT_CONFIG: Omit<ReportConfig, 'revenueStartDate' | 'revenueEndDate' | 'punctualityStartDate' | 'punctualityEndDate'> = {
  companyName: 'CÔNG TY CỔ PHẦN VẬN TẢI XE BUÝT',
  departmentName: 'PHÒNG QUẢN LÝ VẬN HÀNH',
  signerTitle: 'Trưởng phòng quản lý',
  location: 'TP. Hà Nội',
};

// Component nút xuất báo cáo + Modal cấu hình
export default function DashboardReportExport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Lấy bộ lọc từ các biểu đồ
  const { revenueStartDate, revenueEndDate, punctualityStartDate, punctualityEndDate } = useDashboardFilter();

  // Lấy dữ liệu từ các hook cho những thông tin không phụ thuộc filter ngày (hoặc có sẵn)
  const { stats } = useDashboard();
  const { tripStats } = useTripStats();
  const { topDrivers } = useTopDrivers();
  const { popularRoutes } = usePopularRoutes();
  const user = useAuth((state) => state.user);

  // Xử lý xuất PDF
  const handleExport = async () => {
    if (!stats) {
      toast.error('Chưa có dữ liệu thống kê để xuất báo cáo');
      return;
    }

    setIsGenerating(true);
    try {
      // Gọi API lấy dữ liệu doanh thu và tỷ lệ đúng giờ theo khoảng ngày đã chọn tương ứng
      const [revenueRes, punctualityRes] = await Promise.all([
        dashboardService.getRevenueChart(
          toISODateString(revenueStartDate),
          toISODateString(revenueEndDate)
        ),
        dashboardService.getPunctualityStats()
      ]);

      const revenueData = revenueRes.data || [];
      const punctualityDataArray = punctualityRes.data || [];

      // Lọc lại dữ liệu đúng giờ trên frontend theo đúng ngày của tỷ lệ đúng giờ
      const puncStart = new Date(punctualityStartDate).getTime();
      const puncEnd = new Date(punctualityEndDate).getTime();
      let onTime = 0, late = 0;

      for (const day of punctualityDataArray) {
        const dayTime = new Date(day.date).getTime();
        if (dayTime >= puncStart && dayTime <= puncEnd) {
          onTime += day.onTime;
          late += day.late;
        }
      }
      const totalPunctuality = onTime + late;
      const onTimePercent = totalPunctuality > 0 ? Math.round((onTime / totalPunctuality) * 100 * 10) / 10 : 0;

      const reportData: ReportData = {
        stats,
        tripStats: tripStats || [],
        topDrivers: topDrivers || [],
        revenueData: revenueData,
        popularRoutes: popularRoutes || [],
        punctuality: { onTime, late, total: totalPunctuality, onTimePercent },
        currentUserName: user?.fullName || 'Admin',
      };

      const finalConfig: ReportConfig = {
        ...config,
        revenueStartDate,
        revenueEndDate,
        punctualityStartDate,
        punctualityEndDate,
      };

      await generateDashboardPDF(reportData, finalConfig);
      toast.success('Xuất báo cáo PDF thành công!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      toast.error('Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Cập nhật field config
  const updateConfig = (field: keyof typeof DEFAULT_CONFIG, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* Nút Xuất báo cáo */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
      >
        <FileText size={18} />
        Xuất báo cáo
      </button>

      {/* Modal cấu hình báo cáo */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => !isGenerating && setIsModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xl dark:border-gray-700/40 dark:bg-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Xuất báo cáo tổng quan
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      Báo cáo dạng văn bản hành chính, xuất ra file PDF
                    </p>
                  </div>
                  <button
                    onClick={() => !isGenerating && setIsModalOpen(false)}
                    disabled={isGenerating}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                  {/* Thông báo sử dụng bộ lọc */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Thời gian báo cáo:</span> Dữ liệu Doanh thu & Tỷ lệ đúng giờ sẽ được xuất dựa trên bộ lọc ngày hiện tại trên Dashboard.
                    </p>
                  </div>

                  {/* Tên đơn vị */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tên đơn vị / Cơ quan chủ quản
                    </label>
                    <input
                      type="text"
                      value={config.companyName}
                      onChange={(e) => updateConfig('companyName', e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 disabled:opacity-50"
                      placeholder="Ví dụ: CÔNG TY CỔ PHẦN VẬN TẢI XE BUÝT ABC"
                    />
                  </div>

                  {/* Tên phòng ban */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tên phòng ban
                    </label>
                    <input
                      type="text"
                      value={config.departmentName}
                      onChange={(e) => updateConfig('departmentName', e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 disabled:opacity-50"
                      placeholder="Ví dụ: PHÒNG QUẢN LÝ VẬN HÀNH"
                    />
                  </div>

                  {/* 2 cột: Chức danh + Địa danh */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chức danh người ký duyệt
                      </label>
                      <input
                        type="text"
                        value={config.signerTitle}
                        onChange={(e) => updateConfig('signerTitle', e.target.value)}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 disabled:opacity-50"
                        placeholder="Trưởng phòng"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Địa danh
                      </label>
                      <input
                        type="text"
                        value={config.location}
                        onChange={(e) => updateConfig('location', e.target.value)}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 disabled:opacity-50"
                        placeholder="Hà Nội"
                      />
                    </div>
                  </div>

                  {/* Thông tin người lập */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Người lập báo cáo:</span>{' '}
                      {user?.fullName || 'Admin'} ({user?.email || ''})
                    </p>
                    <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                      Thông tin này được lấy tự động từ tài khoản đang đăng nhập
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isGenerating}
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isGenerating || !stats}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang xuất...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Xuất PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
