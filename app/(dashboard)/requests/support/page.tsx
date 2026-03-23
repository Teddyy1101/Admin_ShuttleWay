'use client';

import { useState, useRef, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LifeBuoy,
  Smartphone,
  Globe,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Package,
  ThumbsDown,
  CreditCard,
  HelpCircle,
  Filter,
  FilterX,
  X,
  ArrowRightCircle,
  Inbox,
} from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import {
  SupportTicket,
  SupportTicketStatus,
  TicketCategory,
  TicketReply,
} from '@/types/supportTicket';

// ========== Tiện ích định dạng ==========

// Định dạng ngày giờ hiển thị
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${h}:${m} ${d}/${mo}/${date.getFullYear()}`;
};

// ========== Cấu hình hiển thị ==========

// Cấu hình trạng thái phiếu
const statusConfig: Record<SupportTicketStatus, { label: string; color: string; dotColor: string; bgColor: string; icon: typeof Clock }> = {
  OPEN: {
    label: 'Chờ xử lý',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
    icon: Clock,
  },
  CLOSED: {
    label: 'Đã đóng',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
    icon: CheckCircle2,
  },
};

// Cấu hình danh mục phiếu
const categoryConfig: Record<TicketCategory, { label: string; icon: typeof Package; color: string }> = {
  LOST_ITEM: { label: 'Mất đồ', icon: Package, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  COMPLAINT: { label: 'Khiếu nại', icon: ThumbsDown, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  PAYMENT_ISSUE: { label: 'Lỗi thanh toán', icon: CreditCard, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  GENERAL_INQUIRY: { label: 'Hỏi đáp chung', icon: HelpCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  LANDING_PAGE_CONTACT: { label: 'Liên hệ LP', icon: Globe, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

// ========== Sub-components ==========

// Badge trạng thái
const StatusBadge = ({ status }: { status: SupportTicketStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${status === 'OPEN' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};

// Badge danh mục
const CategoryBadge = ({ category }: { category: TicketCategory }) => {
  const config = categoryConfig[category];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// Lấy tên người gửi
const getSenderName = (ticket: SupportTicket) => {
  if (ticket.user) return ticket.user.fullName;
  return ticket.guestName || 'Không rõ';
};

// ========== Component chính ==========

export default function SupportTicketsPage() {
  const {
    tickets, total, page, limit, isListLoading, params,
    updateFilters, changePage,
    selectedTicket, isDetailLoading, selectedId, selectTicket,
    updateTicketStatus, sendReply,
  } = useSupportTickets({ page: 1, limit: 10 });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mở modal chi tiết = chọn ticket trong hook
  const openDetail = (id: string) => {
    setDetailTicketId(id);
    selectTicket(id);
    setOpenMenuId(null);
  };

  // Đóng modal chi tiết
  const closeDetail = () => {
    setDetailTicketId(null);
    selectTicket(null);
    setReplyContent('');
    setIsStatusMenuOpen(false);
  };

  // Tự động cuộn xuống cuối khung chat khi có reply mới
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.replies]);

  // Tab lọc trạng thái
  const activeTab = params.status || 'ALL';
  const tabs: { id: SupportTicketStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'OPEN', label: 'Chờ xử lý' },
    { id: 'IN_PROGRESS', label: 'Đang xử lý' },
    { id: 'CLOSED', label: 'Đã đóng' },
  ];

  // Kiểm tra bộ lọc nâng cao có đang active không
  const hasAdvancedFilters = !!params.category;

  // Gửi phản hồi
  const handleSendReply = async () => {
    if (!replyContent.trim() || !detailTicketId) return;
    setIsSending(true);
    try {
      await sendReply(detailTicketId, replyContent.trim());
      setReplyContent('');
    } finally {
      setIsSending(false);
    }
  };

  // Xử lý phím Enter để gửi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Đổi trạng thái phiếu
  const handleStatusChange = async (status: SupportTicketStatus) => {
    if (!detailTicketId) return;
    setIsStatusMenuOpen(false);
    await updateTicketStatus(detailTicketId, status);
  };

  // Đổi trạng thái nhanh từ bảng (không cần mở modal)
  const handleQuickStatusChange = async (id: string, status: SupportTicketStatus) => {
    setOpenMenuId(null);
    await updateTicketStatus(id, status);
  };

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Trung tâm hỗ trợ"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Yêu cầu & Hỗ trợ' },
            { label: 'Hỗ trợ' },
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
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabSupport" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
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
                placeholder="Tìm theo tên, tiêu đề phiếu..."
              />
            </div>

            {/* Bộ lọc nâng cao */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${
                  isFilterOpen || hasAdvancedFilters
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
                    <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">Bộ lọc nâng cao</span>
                        {hasAdvancedFilters && (
                          <button
                            onClick={() => updateFilters({ category: undefined })}
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
                            Danh mục
                          </label>
                          <select
                            value={params.category || ''}
                            onChange={(e) => updateFilters({ category: e.target.value as TicketCategory || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="">Tất cả danh mục</option>
                            <option value="LOST_ITEM">Mất đồ</option>
                            <option value="COMPLAINT">Khiếu nại</option>
                            <option value="PAYMENT_ISSUE">Lỗi thanh toán</option>
                            <option value="GENERAL_INQUIRY">Hỏi đáp chung</option>
                            <option value="LANDING_PAGE_CONTACT">Liên hệ Landing Page</option>
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

        {/* ====== Bảng danh sách phiếu hỗ trợ ====== */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Người gửi</th>
                <th className="px-6 py-4 font-semibold">Tiêu đề</th>
                <th className="px-6 py-4 font-semibold">Danh mục</th>
                <th className="px-6 py-4 font-semibold">Nguồn</th>
                <th className="px-6 py-4 font-semibold">Ngày gửi</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isListLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {tickets.map((ticket: SupportTicket) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Người gửi */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {ticket.user?.avatarUrl ? (
                            <img
                              src={ticket.user.avatarUrl}
                              alt={getSenderName(ticket)}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-gray-700">
                              {getSenderName(ticket)?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{getSenderName(ticket)}</p>
                            {(ticket.user?.phone || ticket.guestPhone) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Phone size={11} className="text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.user?.phone || ticket.guestPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tiêu đề */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate block max-w-[200px] font-medium" title={ticket.title}>
                          {ticket.title}
                        </span>
                      </td>

                      {/* Danh mục */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CategoryBadge category={ticket.category} />
                      </td>

                      {/* Nguồn gửi */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ticket.userId
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        }`}>
                          {ticket.userId ? <Smartphone size={12} /> : <Globe size={12} />}
                          {ticket.userId ? 'Từ App' : 'Khách vãng lai'}
                        </span>
                      </td>

                      {/* Ngày gửi */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(ticket.createdAt)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
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
                                  {/* Xem chi tiết & Phản hồi */}
                                  <button
                                    onClick={() => openDetail(ticket.id)}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <Eye size={15} className="text-blue-500" />
                                    Xem chi tiết & Phản hồi
                                  </button>

                                  {/* Chuyển trạng thái nhanh */}
                                  {ticket.status === 'OPEN' && (
                                    <button
                                      onClick={() => handleQuickStatusChange(ticket.id, 'IN_PROGRESS')}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                    >
                                      <ArrowRightCircle size={15} />
                                      Chuyển sang Đang xử lý
                                    </button>
                                  )}

                                  {ticket.status === 'IN_PROGRESS' && (
                                    <button
                                      onClick={() => handleQuickStatusChange(ticket.id, 'CLOSED')}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                      <CheckCircle2 size={15} />
                                      Đóng phiếu
                                    </button>
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
              {!isListLoading && tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox size={32} className="text-gray-300 dark:text-gray-600" />
                      <p>Không tìm thấy phiếu hỗ trợ nào phù hợp.</p>
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

      {/* ====== Modal chi tiết & Phản hồi ====== */}
      <AnimatePresence>
        {detailTicketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
            >
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Đang tải chi tiết...</span>
                  </div>
                </div>
              ) : selectedTicket ? (
                <>
                  {/* ===== Header ===== */}
                  <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 mr-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <LifeBuoy size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{selectedTicket.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CategoryBadge category={selectedTicket.category} />
                          <span className="text-[10px] text-gray-400 font-mono">#{selectedTicket.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown đổi trạng thái */}
                    <div className="relative flex-shrink-0 mr-2">
                      <button
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusConfig[selectedTicket.status].bgColor} ${statusConfig[selectedTicket.status].color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedTicket.status].dotColor}`} />
                        {statusConfig[selectedTicket.status].label}
                        <ChevronDown size={12} className={`transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isStatusMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsStatusMenuOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                            >
                              {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as SupportTicketStatus[]).map(status => {
                                const cfg = statusConfig[status];
                                const StatusIcon = cfg.icon;
                                const isCurrent = selectedTicket.status === status;
                                return (
                                  <button
                                    key={status}
                                    disabled={isCurrent}
                                    onClick={() => handleStatusChange(status)}
                                    className={`flex items-center gap-2 w-full px-3.5 py-2.5 text-xs transition-colors ${
                                      isCurrent
                                        ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed'
                                        : `hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300`
                                    }`}
                                  >
                                    <StatusIcon size={14} className={isCurrent ? 'text-gray-400' : ''} />
                                    {cfg.label}
                                    {isCurrent && <span className="ml-auto text-[10px] text-gray-400">Hiện tại</span>}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={closeDetail}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* ===== Thông tin người gửi ===== */}
                  <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {selectedTicket.user?.avatarUrl ? (
                        <img src={selectedTicket.user.avatarUrl} alt={getSenderName(selectedTicket)} className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-700">
                          {getSenderName(selectedTicket)?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{getSenderName(selectedTicket)}</p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            selectedTicket.userId
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                          }`}>
                            {selectedTicket.userId ? <Smartphone size={10} /> : <Globe size={10} />}
                            {selectedTicket.userId ? 'App' : 'Khách vãng lai'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {(selectedTicket.user?.phone || selectedTicket.guestPhone) && (
                            <a href={`tel:${selectedTicket.user?.phone || selectedTicket.guestPhone}`} className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Phone size={10} />
                              {selectedTicket.user?.phone || selectedTicket.guestPhone}
                            </a>
                          )}
                          {(selectedTicket.user?.email || selectedTicket.guestEmail) && (
                            <a href={`mailto:${selectedTicket.user?.email || selectedTicket.guestEmail}`} className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Mail size={10} />
                              {selectedTicket.user?.email || selectedTicket.guestEmail}
                            </a>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock size={10} />
                            {formatDateTime(selectedTicket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== Nội dung gốc + Lịch sử chat ===== */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Tin nhắn gốc */}
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {getSenderName(selectedTicket)?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{getSenderName(selectedTicket)}</span>
                          <span className="text-[10px] text-gray-400">{formatDateTime(selectedTicket.createdAt)}</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.content}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies?.map((reply: TicketReply) => {
                      const isAdmin = reply.sender?.role === 'ADMIN';
                      return (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                            isAdmin
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                              : 'bg-gradient-to-br from-blue-500 to-violet-500 text-white'
                          }`}>
                            {reply.sender?.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>

                          <div className={`flex-1 ${isAdmin ? 'flex flex-col items-end' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {reply.sender?.fullName || 'Hệ thống'}
                              </span>
                              {isAdmin && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
                                  Admin
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400">{formatDateTime(reply.createdAt)}</span>
                            </div>
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${
                              isAdmin
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                            }`}>
                              {reply.content}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    <div ref={chatEndRef} />
                  </div>

                  {/* ===== Input gửi phản hồi ===== */}
                  <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {selectedTicket.status === 'CLOSED' ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                        <CheckCircle2 size={16} />
                        Phiếu này đã được đóng. Không thể gửi phản hồi thêm.
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Nhập phản hồi... (Enter gửi, Shift+Enter xuống dòng)"
                          rows={2}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyContent.trim() || isSending}
                          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm shadow-blue-600/20"
                        >
                          <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
