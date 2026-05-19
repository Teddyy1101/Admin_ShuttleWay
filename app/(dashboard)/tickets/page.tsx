'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  GraduationCap,
  MapPin,
  CalendarRange,
  XCircle,
  CheckCircle2,
  Clock,
  Ban,
  CreditCard,
  Filter,
  FilterX,
  MoreHorizontal,
  ArrowUpCircle,
  UserCircle,
} from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';
import { Ticket, TicketStatus, TicketType } from '@/types/ticket';

// Định dạng ngày giờ hiển thị
const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Định dạng tiền VNĐ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Huy hiệu loại vé
const TicketTypeBadge = ({ type }: { type: 'MONTHLY' | 'SINGLE_TRIP' }) => {
  const isMonthly = type === 'MONTHLY';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isMonthly
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
    }`}>
      {isMonthly ? <CalendarRange size={12} /> : <CreditCard size={12} />}
      {isMonthly ? 'Vé tháng' : 'Vé lượt'}
    </span>
  );
};

// Tính trạng thái hiển thị thực tế (fix vé quá hạn nhưng cron chưa chạy)
const getDisplayStatus = (ticket: Ticket): TicketStatus => {
  if (ticket.status === 'ACTIVE' && ticket.validUntil) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const until = new Date(ticket.validUntil);
    until.setHours(0, 0, 0, 0);
    if (until < today) return 'EXPIRED';
  }
  return ticket.status;
};

// Huy hiệu trạng thái vé
const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const configs = {
    ACTIVE: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2, label: 'Đang hoạt động' },
    EXPIRED: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock, label: 'Hết hạn' },
    CANCELLED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Ban, label: 'Đã hủy' },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

export default function TicketsPage() {
  const {
    tickets, total, page, limit, isLoading, params,
    updateFilters, changePage, cancelTicket,
  } = useTickets({ page: 1, limit: 10 });

  const [ticketToCancel, setTicketToCancel] = useState<Ticket | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Xử lý xác nhận hủy vé
  const confirmCancel = async () => {
    if (ticketToCancel) {
      await cancelTicket(ticketToCancel.id);
      setTicketToCancel(null);
    }
  };

  // Xử lý tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value || undefined });
  };

  // Cấu hình tabs lọc theo trạng thái
  const activeTab = params.status || 'ALL';
  const tabs: { id: TicketStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ACTIVE', label: 'Đang hoạt động' },
    { id: 'EXPIRED', label: 'Hết hạn' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý vé"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Vé & Khuyến mãi' },
            { label: 'Danh sách vé' },
          ]}
        />
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Tabs lọc + Thanh tìm kiếm */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => updateFilters({ status: tab.id === 'ALL' ? undefined : tab.id })}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabTicket" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
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
                placeholder="Tìm theo tên học sinh, tuyến xe..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>

            {/* Bộ lọc mở rộng */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${
                  isFilterOpen || params.ticketType
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Filter size={16} />
                {params.ticketType && (
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
                      className="absolute right-0 top-full mt-2 w-64 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">Bộ lọc nâng cao</span>
                        {params.ticketType && (
                          <button
                            onClick={() => updateFilters({ ticketType: undefined })}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <FilterX size={12} />
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Loại vé
                          </label>
                          <select
                            value={params.ticketType || ''}
                            onChange={(e) => updateFilters({ ticketType: e.target.value as TicketType || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="">Tất cả loại vé</option>
                            <option value="MONTHLY">Vé tháng</option>
                            <option value="SINGLE_TRIP">Vé lượt</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bảng danh sách vé */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Học sinh</th>
                <th className="px-6 py-4 font-semibold">Người đặt</th>
                <th className="px-6 py-4 font-semibold">Tuyến xe</th>
                <th className="px-6 py-4 font-semibold">Điểm đón</th>
                <th className="px-6 py-4 font-semibold">Loại vé</th>
                <th className="px-6 py-4 font-semibold">Giá mua</th>
                <th className="px-6 py-4 font-semibold">Hiệu lực</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton loading UI
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {tickets.map((ticket: Ticket) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Học sinh */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <GraduationCap size={16} />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {ticket.student.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Người đặt */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.parent ? (
                          <div className="flex items-center gap-2">
                            <UserCircle size={14} className="text-blue-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{ticket.parent.fullName}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                            Tự đặt
                          </span>
                        )}
                      </td>

                      {/* Tuyến xe */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[160px]" title={ticket.route.name}>
                            {ticket.route.name}
                          </span>
                        </div>
                      </td>

                      {/* Điểm đón */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.pickUpStation ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <ArrowUpCircle size={13} className="flex-shrink-0" />
                            <span className="truncate max-w-[140px]" title={ticket.pickUpStation.name}>
                              {ticket.pickUpStation.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa chọn</span>
                        )}
                      </td>

                      {/* Loại vé */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TicketTypeBadge type={ticket.ticketType} />
                      </td>

                      {/* Giá mua */}
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(ticket.priceAtBuy)}
                      </td>

                      {/* Hiệu lực */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            Từ: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDateTime(ticket.validFrom)}</span>
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Đến: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDateTime(ticket.validUntil)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={getDisplayStatus(ticket)} />
                      </td>

                      {/* Thao tác */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === ticket.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                                >
                                  {/* Hủy vé - chỉ hiện khi ACTIVE */}
                                  {ticket.status === 'ACTIVE' ? (
                                    <button
                                      onClick={() => { setTicketToCancel(ticket); setOpenMenuId(null); }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <XCircle size={15} />
                                      Hủy vé
                                    </button>
                                  ) : (
                                    <span className="block px-4 py-2.5 text-sm text-gray-400 italic">Không có thao tác</span>
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
              {!isLoading && tickets.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Không tìm thấy vé nào phù hợp.</p>
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
            showingCount={tickets.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* Modal xác nhận hủy vé */}
      <ConfirmModal
        isOpen={!!ticketToCancel}
        onClose={() => setTicketToCancel(null)}
        onConfirm={confirmCancel}
        title="Xác nhận hủy vé"
        description={`Bạn có chắc chắn muốn hủy vé của học sinh "${ticketToCancel?.student.fullName}"? Hành động này không thể hoàn tác.`}
        confirmText="Đồng ý hủy"
        icon={XCircle}
      />
    </PageWrapper>
  );
}
