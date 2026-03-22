'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Users,
  CalendarDays,
  Shield,
  Car,
  GraduationCap,
  User as UserIcon,
} from 'lucide-react';

import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { useGroupedNotifications } from '@/hooks/useGroupedNotifications';

// Format ngày giờ tiếng Việt
const formatDateTime = (dateString?: string | Date | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

// Cấu hình badge vai trò
const ROLE_CONFIG: Record<string, { color: string; icon: typeof Shield; label: string }> = {
  ADMIN: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield, label: 'Admin' },
  DRIVER: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Car, label: 'Tài xế' },
  PARENT: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: UserIcon, label: 'Phụ huynh' },
  STUDENT: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: GraduationCap, label: 'Học sinh' },
};

// Badge vai trò
const RoleBadge = ({ role }: { role: string }) => {
  const config = ROLE_CONFIG[role];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
};

// Thanh tiến trình tỷ lệ đọc
const ReadRateBar = ({ readCount, total }: { readCount: number; total: number }) => {
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 min-w-[160px]">
        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percent >= 80
                ? 'bg-emerald-500'
                : percent >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap w-10 text-right">
          {percent}%
        </span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {readCount}/{total} người đã đọc
      </p>
    </div>
  );
};

export default function NotificationHistoryPage() {
  const {
    campaigns,
    total,
    page,
    limit,
    isLoading,
    updateFilters,
    changePage,
  } = useGroupedNotifications({ page: 1, limit: 10 });

  const [searchValue, setSearchValue] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Xử lý tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    updateFilters({ search: value || undefined });
  };

  // Xử lý lọc ngày
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromDate(value);
    updateFilters({ fromDate: value || undefined });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToDate(value);
    updateFilters({ toDate: value || undefined });
  };

  // Xóa bộ lọc ngày
  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    updateFilters({ fromDate: undefined, toDate: undefined });
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <PageHeader
          title="Lịch sử thông báo"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý thông báo' },
            { label: 'Lịch sử' },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header + Bộ lọc */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
          {/* Dòng 1: Tiêu đề + Tìm kiếm */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Chiến dịch thông báo đã gửi</h2>
              <p className="text-xs text-gray-500">{total} chiến dịch</p>
            </div>

            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white placeholder-gray-400 transition-all"
                placeholder="Tìm theo tiêu đề, nội dung..."
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Dòng 2: Bộ lọc ngày */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">Từ ngày</span>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Đến ngày</span>
              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={handleClearDateFilter}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Thông báo</th>
                <th className="px-6 py-4 font-semibold">Đối tượng</th>
                <th className="px-6 py-4 font-semibold">Số người nhận</th>
                <th className="px-6 py-4 font-semibold">Tỷ lệ đã đọc</th>
                <th className="px-6 py-4 font-semibold">Thời gian gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton UI
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-24" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-40" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {campaigns.map((campaign, index) => (
                    <motion.tr
                      key={`${campaign.title}-${campaign.latestSentAt}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Tiêu đề + Nội dung */}
                      <td className="px-6 py-4 max-w-[360px]">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Bell size={14} className="text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{campaign.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{campaign.body}</p>
                          </div>
                        </div>
                      </td>

                      {/* Đối tượng (vai trò) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {campaign.targetRoles?.map((role) => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </td>

                      {/* Số người nhận */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">{campaign.totalRecipients}</span>
                          <span className="text-xs text-gray-500">người</span>
                        </div>
                      </td>

                      {/* Tỷ lệ đã đọc */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ReadRateBar readCount={campaign.readCount} total={campaign.totalRecipients} />
                      </td>

                      {/* Thời gian gửi */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(campaign.latestSentAt)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {!isLoading && campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Bell size={28} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 dark:text-gray-300">Chưa có thông báo nào</p>
                        <p className="text-sm mt-1">Thông báo sẽ hiển thị ở đây sau khi bạn gửi</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalItems={total}
            limit={limit}
            showingCount={campaigns.length}
            onPageChange={changePage}
          />
        )}
      </div>
    </PageWrapper>
  );
}
