'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  FilterX,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarX,
  Clock,
  CalendarRange,
  Phone,
  User,
  Bus,
  X,
  FileText,
} from 'lucide-react';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { LeaveRequest, LeaveStatus } from '@/types/leaveRequest';

// Định dạng ngày hiển thị (dd/mm/yyyy)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Định dạng ngày giờ đầy đủ
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

// Tính số ngày nghỉ
const calcDays = (from: string, to: string) => {
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
  return Math.max(1, Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

// Cấu hình badge trạng thái
const statusConfig: Record<LeaveStatus, { label: string; color: string; dotColor: string }> = {
  PENDING: {
    label: 'Chờ duyệt',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Đã duyệt',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
};

// Badge trạng thái đơn xin nghỉ
const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

export default function LeaveRequestsPage() {
  const {
    leaveRequests, total, page, limit, isLoading, params,
    updateFilters, changePage, approveRequest, rejectRequest,
  } = useLeaveRequests({ page: 1, limit: 10 });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [requestToApprove, setRequestToApprove] = useState<LeaveRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<LeaveRequest | null>(null);

  // Xử lý duyệt đơn
  const handleApprove = async () => {
    if (requestToApprove) {
      await approveRequest(requestToApprove.id);
      setRequestToApprove(null);
    }
  };

  // Xử lý từ chối đơn
  const handleReject = async () => {
    if (requestToReject) {
      await rejectRequest(requestToReject.id);
      setRequestToReject(null);
    }
  };

  // Cấu hình tabs lọc theo trạng thái
  const activeTab = params.status || 'ALL';
  const tabs: { id: LeaveStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ duyệt' },
    { id: 'APPROVED', label: 'Đã duyệt' },
    { id: 'REJECTED', label: 'Từ chối' },
  ];

  // Kiểm tra bộ lọc nâng cao có đang active không
  const hasAdvancedFilters = !!(params.fromDate || params.toDate);

  // Lấy danh sách tuyến xe duy nhất từ vé active của học sinh
  const getStudentRoutes = (req: LeaveRequest) => {
    const tickets = req.student?.studentTickets || [];
    const uniqueRoutes = tickets
      .map(t => t.route?.name)
      .filter((name, idx, arr) => name && arr.indexOf(name) === idx);
    return uniqueRoutes.length > 0 ? uniqueRoutes.join(', ') : '—';
  };

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý đơn xin nghỉ"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Xin nghỉ' },
          ]}
        />
      </div>

      {/* ====== Bảng dữ liệu chính ====== */}
      <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Tabs lọc + Tìm kiếm */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => updateFilters({ status: tab.id === 'ALL' ? undefined : tab.id })}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabLeave" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto pb-3">
            <div className="relative flex-1 sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:border-transparent dark:text-white placeholder-gray-400 outline-none"
                placeholder="Tìm theo tên học sinh..."
                value={params.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              />
            </div>

            {/* Bộ lọc nâng cao */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${isFilterOpen || hasAdvancedFilters
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Filter size={16} />
                {hasAdvancedFilters && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    {/* Overlay để đóng popup khi click ra ngoài */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsFilterOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">Bộ lọc nâng cao</span>
                        {hasAdvancedFilters && (
                          <button
                            onClick={() => updateFilters({ fromDate: undefined, toDate: undefined })}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <FilterX size={12} />
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 relative z-10">
                        {/* Lọc ngày bắt đầu nghỉ */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={params.fromDate || ''}
                            onChange={(e) => updateFilters({ fromDate: e.target.value || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={params.toDate || ''}
                            onChange={(e) => updateFilters({ toDate: e.target.value || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ====== Bảng dữ liệu chi tiết ====== */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Học sinh & Tuyến xe</th>
                <th className="px-6 py-4 font-semibold">Người gửi (PH)</th>
                <th className="px-6 py-4 font-semibold">Thời gian nghỉ</th>
                <th className="px-6 py-4 font-semibold">Lý do</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {leaveRequests.map((req: LeaveRequest) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Học sinh & Tuyến xe */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {req.student.avatarUrl ? (
                            <img
                              src={req.student.avatarUrl}
                              alt={req.student.fullName}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-gray-700">
                              {req.student.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{req.student.fullName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Bus size={11} className="text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[160px]" title={getStudentRoutes(req)}>
                                {getStudentRoutes(req)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Người gửi (Phụ huynh) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{req.parent.fullName}</p>
                          {req.parent.phone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone size={11} className="text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{req.parent.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thời gian nghỉ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={14} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(req.fromDate)} - {formatDate(req.toDate)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {calcDays(req.fromDate, req.toDate)} ngày
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Lý do */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate block max-w-[180px]" title={req.reason || '—'}>
                          {req.reason || '—'}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* ====== Thao tác ====== */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === req.id ? null : req.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === req.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                                >
                                  {/* Xem chi tiết */}
                                  <button
                                    onClick={() => { setDetailRequest(req); setOpenMenuId(null); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <Eye size={15} className="text-blue-500" />
                                    Xem chi tiết
                                  </button>

                                  {/* Duyệt đơn - chỉ hiện cho PENDING */}
                                  {req.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => { setRequestToApprove(req); setOpenMenuId(null); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                      >
                                        <CheckCircle2 size={15} />
                                        Duyệt đơn
                                      </button>

                                      <button
                                        onClick={() => { setRequestToReject(req); setOpenMenuId(null); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      >
                                        <XCircle size={15} />
                                        Từ chối
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {/* Trạng thái rỗng */}
              {!isLoading && leaveRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarX size={32} className="text-gray-300 dark:text-gray-600" />
                      <p>Không tìm thấy đơn xin nghỉ nào phù hợp.</p>
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
            showingCount={leaveRequests.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* ====== Modal xem chi tiết đơn xin nghỉ ====== */}
      <AnimatePresence>
        {detailRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết đơn xin nghỉ</h3>
                    <p className="text-xs text-gray-500 font-mono">{detailRequest.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailRequest(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  {/* Học sinh */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User size={14} />
                      Học sinh
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailRequest.student.fullName}</span>
                  </div>

                  {/* Tuyến xe */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Bus size={14} />
                      Tuyến xe
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{getStudentRoutes(detailRequest)}</span>
                  </div>

                  {/* Phụ huynh */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User size={14} />
                      Phụ huynh
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailRequest.parent.fullName}</span>
                  </div>

                  {/* SĐT phụ huynh */}
                  {detailRequest.parent.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Phone size={14} />
                        Số điện thoại
                      </span>
                      <a href={`tel:${detailRequest.parent.phone}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {detailRequest.parent.phone}
                      </a>
                    </div>
                  )}

                  {/* Trạng thái */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <StatusBadge status={detailRequest.status} />
                  </div>

                  {/* Ngày tạo */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ngày gửi đơn</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDateTime(detailRequest.createdAt)}</span>
                  </div>
                </div>

                {/* Thời gian nghỉ */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarRange size={15} className="text-blue-500" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Thời gian nghỉ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Từ ngày</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(detailRequest.fromDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Đến ngày</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(detailRequest.toDate)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Tổng thời gian</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {calcDays(detailRequest.fromDate, detailRequest.toDate)} ngày
                    </span>
                  </div>
                </div>

                {/* Lý do */}
                {detailRequest.reason && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Lý do nghỉ</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{detailRequest.reason}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                {detailRequest.status === 'PENDING' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setRequestToReject(detailRequest); setDetailRequest(null); }}
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => { setRequestToApprove(detailRequest); setDetailRequest(null); }}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-emerald-600/20"
                    >
                      Duyệt đơn
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDetailRequest(null)}
                    className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====== Modal xác nhận duyệt đơn ====== */}
      <ConfirmModal
        isOpen={!!requestToApprove}
        onClose={() => setRequestToApprove(null)}
        onConfirm={handleApprove}
        title="Duyệt đơn xin nghỉ"
        description={`Xác nhận duyệt đơn xin nghỉ của "${requestToApprove?.student?.fullName || 'Học sinh'}" từ ${requestToApprove ? formatDate(requestToApprove.fromDate) : ''} đến ${requestToApprove ? formatDate(requestToApprove.toDate) : ''}? Hệ thống sẽ tự động gạch tên học sinh khỏi danh sách điểm danh trong khoảng thời gian nghỉ.`}
        confirmText="Duyệt đơn"
        icon={CheckCircle2}
        variant="info"
      />

      {/* ====== Modal xác nhận từ chối đơn ====== */}
      <ConfirmModal
        isOpen={!!requestToReject}
        onClose={() => setRequestToReject(null)}
        onConfirm={handleReject}
        title="Từ chối đơn xin nghỉ"
        description={`Xác nhận từ chối đơn xin nghỉ của "${requestToReject?.student?.fullName || 'Học sinh'}" từ ${requestToReject ? formatDate(requestToReject.fromDate) : ''} đến ${requestToReject ? formatDate(requestToReject.toDate) : ''}?`}
        confirmText="Từ chối"
        icon={XCircle}
        variant="danger"
      />
    </PageWrapper>
  );
}
