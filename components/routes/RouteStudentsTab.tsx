'use client';

import { useState } from 'react';
import { Route } from '@/types/route';
import { Ticket, TicketType, TicketStatus } from '@/types/ticket';
import { useTickets } from '@/hooks/useTickets';
import { Search, XCircle, Eye, User as UserIcon, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StudentDetailDrawer from './StudentDetailDrawer';

interface RouteStudentsTabProps {
  route: Route;
}

export default function RouteStudentsTab({ route }: RouteStudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TicketType | ''>('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');

  // State cho drawer chi tiết học sinh
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lấy danh sách vé thuộc tuyến đường này
  const {
    tickets,
    total,
    page,
    limit,
    isLoading,
    updateFilters,
    changePage,
    cancelTicket,
    mutate,
  } = useTickets({ routeId: route.id, limit: 10 });

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilters({ search: value || undefined });
  };

  // Xử lý thay đổi bộ lọc loại vé
  const handleFilterType = (value: string) => {
    const newType = value as TicketType | '';
    setFilterType(newType);
    updateFilters({ ticketType: newType || undefined });
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleFilterStatus = (value: string) => {
    const newStatus = value as TicketStatus | '';
    setFilterStatus(newStatus);
    updateFilters({ status: newStatus || undefined });
  };

  // Mở drawer chi tiết
  const openDrawer = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  // Xử lý hủy vé với xác nhận
  const handleCancelTicket = async (ticket: Ticket) => {
    if (ticket.status === 'CANCELLED') {
      toast.error('Vé này đã được hủy trước đó');
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy vé của học sinh "${ticket.student.fullName}"?`
    );
    if (!confirmed) return;

    try {
      await cancelTicket(ticket.id);
    } catch {
      // Lỗi đã được xử lý trong hook
    }
  };

  // Xử lý hiển thị badge trạng thái vé
  const getStatusBadge = (ticket: Ticket) => {
    const now = new Date();
    const validUntil = new Date(ticket.validUntil);

    if (ticket.status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Đã hủy
        </span>
      );
    }

    if (ticket.status === 'EXPIRED' || validUntil < now) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Hết hạn
        </span>
      );
    }

    // Tính số ngày còn lại
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Còn {daysLeft} ngày
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Còn {daysLeft} ngày
      </span>
    );
  };

  // Hiển thị loại vé
  const getTicketTypeBadge = (type: string) => {
    if (type === 'MONTHLY') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Vé Tháng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        Vé Lượt
      </span>
    );
  };

  // Tạo initials từ tên cho avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(total / limit);

  // Format ngày cho cột "Hạn vé"
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Thanh tìm kiếm + Bộ lọc */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Danh sách học sinh ({total})
        </h3>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Bộ lọc loại vé */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => handleFilterType(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả loại vé</option>
              <option value="MONTHLY">Vé Tháng</option>
              <option value="SINGLE_TRIP">Vé Lượt</option>
            </select>
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <svg className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <svg className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto relative min-h-[200px]">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Học sinh</th>
                <th className="px-5 py-3.5 font-semibold">Phụ huynh</th>
                <th className="px-5 py-3.5 font-semibold">Loại vé</th>
                <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-5 py-3.5 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {tickets.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {searchTerm || filterType || filterStatus
                          ? 'Không tìm thấy học sinh phù hợp'
                          : 'Chưa có học sinh nào đăng ký tuyến này'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: Ticket) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors"
                  >
                    {/* Cột: Học sinh (Avatar + Tên + Mã HS) */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {ticket.student.avatarUrl ? (
                          <img
                            src={ticket.student.avatarUrl}
                            alt={ticket.student.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-gray-700">
                            {getInitials(ticket.student.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                            {ticket.student.fullName}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột: Phụ huynh (Tên + SĐT) */}
                    <td className="px-5 py-3.5">
                      {ticket.parent ? (
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            {ticket.parent.fullName}
                          </p>
                          {ticket.parent.phone ? (
                            <a
                              href={`tel:${ticket.parent.phone}`}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-0.5 inline-block"
                            >
                              {ticket.parent.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 mt-0.5 inline-block">Chưa có SĐT</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Cột: Loại vé */}
                    <td className="px-5 py-3.5">
                      {getTicketTypeBadge(ticket.ticketType)}
                    </td>

                    {/* Cột: Trạng thái (ngày hết hạn) */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(ticket)}
                        <span className="text-[11px] text-gray-400">
                          HSD: {formatDate(ticket.validUntil)}
                        </span>
                      </div>
                    </td>

                    {/* Cột: Hành động */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Chỉ hiện nút Hủy vé khi status ACTIVE và chưa hết hạn theo ngày */}
                        {ticket.status === 'ACTIVE' && new Date(ticket.validUntil) >= new Date() && (
                          <button
                            onClick={() => handleCancelTicket(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            title="Hủy vé"
                          >
                            <XCircle size={14} />
                            Hủy vé
                          </button>
                        )}
                        <button
                          onClick={() => openDrawer(ticket)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} kết quả
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400 text-xs">…</span>
                    )}
                    <button
                      onClick={() => changePage(p)}
                      className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => changePage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer chi tiết học sinh */}
      <StudentDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ticket={selectedTicket}
        route={route}
      />
    </div>
  );
}
