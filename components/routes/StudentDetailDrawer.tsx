'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Clock, User as UserIcon } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { Route, Station } from '@/types/route';
import { ticketService } from '@/services/ticketService';

// Kiểu dữ liệu lịch sử điểm danh trả về từ API
interface AttendanceRecord {
  id: string;
  status: 'PENDING' | 'BOARDED' | 'ALIGHTED' | 'ABSENT';
  boardedAt: string | null;
  alightedAt: string | null;
  trip: {
    scheduledDate: string;
    direction: string;
    startTime: string | null;
    endTime: string | null;
  };
}

interface StudentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  route: Route;
}

export default function StudentDetailDrawer({ isOpen, onClose, ticket, route }: StudentDetailDrawerProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (isOpen && ticket) {
      setLoadingAttendance(true);
      ticketService
        .getAttendanceHistory(ticket.student.id, route.id)
        .then((res) => {
          setAttendances(res.result || []);
        })
        .catch(() => {
          setAttendances([]);
        })
        .finally(() => setLoadingAttendance(false));
    } else {
      setAttendances([]);
    }
  }, [isOpen, ticket, route.id]);

  // Lấy trạm đón (orderIndex nhỏ nhất) và trạm trả (orderIndex lớn nhất)
  const sortedStations = (route.routeStations || [])
    .filter((rs) => rs.station.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const pickupStation = sortedStations[0]?.station;
  const dropoffStation = sortedStations[sortedStations.length - 1]?.station;

  // Tạo initials từ tên cho avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format ngày
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format giờ
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Format ngày ngắn gọn cho timeline (VD: "Hôm nay", "Hôm qua", "Thứ 4 (18/03)")
  const formatTimelineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diff = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 0) return `Hôm nay (${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`;
      if (diff === 1) return `Hôm qua (${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`;

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      return `${dayNames[d.getDay()]} (${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`;
    } catch {
      return dateStr;
    }
  };

  // Badge trạng thái vé
  const getStatusInfo = (t: Ticket) => {
    const now = new Date();
    const validUntil = new Date(t.validUntil);

    if (t.status === 'CANCELLED') {
      return { label: 'Đã hủy', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' };
    }
    if (t.status === 'EXPIRED' || validUntil < now) {
      return { label: 'Hết hạn', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', dot: 'bg-gray-400' };
    }
    return { label: 'Đang hoạt động', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
  };

  if (!ticket) return null;

  const statusInfo = getStatusInfo(ticket);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin học sinh</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung cuộn */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

              {/* === KHỐI 1: Thông tin Định danh & Liên hệ === */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-5 border border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center gap-4 mb-4">
                  {/* Avatar học sinh */}
                  {ticket.student.avatarUrl ? (
                    <img
                      src={ticket.student.avatarUrl}
                      alt={ticket.student.fullName}
                      className="w-16 h-16 rounded-full object-cover ring-3 ring-white dark:ring-gray-800 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold ring-3 ring-white dark:ring-gray-800 shadow-md">
                      {getInitials(ticket.student.fullName)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {ticket.student.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      Mã HS: {ticket.student.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Thông tin phụ huynh */}
                {ticket.parent && (
                  <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3.5 border border-blue-100/50 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Phụ huynh</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {ticket.parent.fullName}
                    </p>
                    {ticket.parent.phone ? (
                      <a
                        href={`tel:${ticket.parent.phone}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-500/25"
                      >
                        <Phone size={15} />
                        {ticket.parent.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Chưa có số điện thoại</span>
                    )}
                  </div>
                )}
              </div>

              {/* === KHỐI 2: Thông tin Thẻ/Vé === */}
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700/50">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Thông tin vé
                </h4>
                <div className="space-y-3">
                  {/* Loại vé */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loại vé</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      ticket.ticketType === 'MONTHLY'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {ticket.ticketType === 'MONTHLY' ? 'Vé Tháng' : 'Vé Lượt'}
                    </span>
                  </div>
                  {/* Trạng thái */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>
                  </div>
                  {/* Ngày hết hạn */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ngày hết hạn</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(ticket.validUntil)}</span>
                  </div>
                </div>
              </div>

              {/* === KHỐI 3: Điểm đón / Trả === */}
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700/50">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-500" />
                  Điểm đón / Trả
                </h4>
                <div className="space-y-3">
                  {/* Trạm lên xe */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-900/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Trạm lên xe</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {pickupStation?.name || 'Chưa có trạm'}
                      </p>
                    </div>
                  </div>
                  {/* Đường kẻ nối */}
                  <div className="ml-[5px] border-l-2 border-dashed border-gray-200 dark:border-gray-700 h-4" />
                  {/* Trạm xuống xe */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-3 h-3 rounded-full bg-red-400 ring-4 ring-red-100 dark:ring-red-900/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Trạm xuống xe</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {dropoffStation?.name || 'Chưa có trạm'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* === KHỐI 4: Lịch sử Điểm danh === */}
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700/50">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  Lịch sử điểm danh gần đây
                </h4>

                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : attendances.length === 0 ? (
                  <div className="text-center py-6">
                    <UserIcon size={20} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Chưa có dữ liệu điểm danh</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {attendances.map((att, idx) => {
                      // Xác định icon và màu theo trạng thái
                      let dotColor = 'bg-gray-300 dark:bg-gray-600';
                      let statusLabel = '';
                      let statusColor = 'text-gray-500';

                      if (att.status === 'BOARDED' || att.status === 'ALIGHTED') {
                        dotColor = 'bg-emerald-500';
                        statusColor = 'text-emerald-600 dark:text-emerald-400';
                        const boarded = formatTime(att.boardedAt);
                        const alighted = formatTime(att.alightedAt);
                        statusLabel = `Lên xe lúc ${boarded}${att.alightedAt ? ` – Xuống xe lúc ${alighted}` : ''}`;
                      } else if (att.status === 'ABSENT') {
                        dotColor = 'bg-red-500';
                        statusColor = 'text-red-600 dark:text-red-400';
                        statusLabel = 'Vắng mặt';
                      } else {
                        // PENDING
                        dotColor = 'bg-gray-400';
                        statusColor = 'text-gray-500';
                        statusLabel = 'Chưa điểm danh';
                      }

                      return (
                        <div key={att.id} className="flex items-start gap-3 relative">
                          {/* Đường kẻ timeline */}
                          {idx < attendances.length - 1 && (
                            <div className="absolute left-[5px] top-[14px] bottom-[-2px] w-px bg-gray-200 dark:bg-gray-700" />
                          )}
                          {/* Dot */}
                          <div className={`mt-1 w-[11px] h-[11px] rounded-full ${dotColor} flex-shrink-0 z-10 ring-2 ring-white dark:ring-gray-900`} />
                          {/* Nội dung */}
                          <div className="pb-4 flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {formatTimelineDate(att.trip.scheduledDate)}
                            </p>
                            <p className={`text-xs mt-0.5 ${statusColor}`}>
                              {att.status === 'ABSENT' ? '🔴 ' : att.status === 'BOARDED' || att.status === 'ALIGHTED' ? '🟢 ' : '⚪ '}
                              {statusLabel}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
