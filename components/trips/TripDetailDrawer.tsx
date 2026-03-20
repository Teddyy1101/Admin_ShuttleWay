'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  User,
  Bus,
  Clock,
  Route,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useTripDetail } from '@/hooks/useTripDetail';
import { tripService } from '@/services/tripService';
import {
  TripStatus,
  AttendanceStatus,
  TripAttendanceItem,
  Direction,
} from '@/types/trip';
import toast from 'react-hot-toast';

interface TripDetailDrawerProps {
  isOpen: boolean;
  tripId: string | null;
  onClose: () => void;
  onDataChanged: () => void;
}

// Config badge điểm danh
const attendanceConfig: Record<AttendanceStatus, {
  label: string;
  emoji: string;
  classes: string;
  dotClass: string;
}> = {
  [AttendanceStatus.PENDING]: {
    label: 'Chưa lên xe',
    emoji: '⚪',
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    dotClass: 'bg-gray-400',
  },
  [AttendanceStatus.BOARDED]: {
    label: 'Đã lên xe',
    emoji: '🟢',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  [AttendanceStatus.ALIGHTED]: {
    label: 'Đã xuống xe',
    emoji: '🔵',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotClass: 'bg-blue-500',
  },
  [AttendanceStatus.ABSENT]: {
    label: 'Nghỉ học',
    emoji: '🔴',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
};

// Config trạng thái chuyến
const tripStatusConfig: Record<TripStatus, { label: string; classes: string }> = {
  [TripStatus.PENDING]: { label: 'Chờ chạy', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  [TripStatus.IN_PROGRESS]: { label: 'Đang chạy', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  [TripStatus.COMPLETED]: { label: 'Hoàn thành', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  [TripStatus.CANCELLED]: { label: 'Đã hủy', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function TripDetailDrawer({ isOpen, tripId, onClose, onDataChanged }: TripDetailDrawerProps) {
  const { tripDetail, isLoading, mutate } = useTripDetail(isOpen ? tripId : null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý cập nhật điểm danh thủ công
  const handleUpdateAttendance = async (attendance: TripAttendanceItem, newStatus: AttendanceStatus) => {
    if (!tripId) return;
    setUpdatingId(attendance.id);
    setActiveDropdown(null);
    try {
      await tripService.adminUpdateAttendance(tripId, {
        studentId: attendance.studentId,
        status: newStatus,
      });
      toast.success(`Đã cập nhật trạng thái: ${attendanceConfig[newStatus].label}`);
      mutate();
      onDataChanged();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Lỗi cập nhật điểm danh');
    } finally {
      setUpdatingId(null);
    }
  };

  // Format giờ
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // Format ngày
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Kiểm tra chuyến có thể điểm danh thủ công hay không
  const canManualAttendance = tripDetail?.status === TripStatus.PENDING || tripDetail?.status === TripStatus.IN_PROGRESS;

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
            className="fixed top-0 right-0 h-screen w-full sm:w-[520px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết chuyến đi</h2>
                {tripDetail && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tripDetail.route.routeCode} — {formatDate(tripDetail.scheduledDate)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : tripDetail ? (
                <div className="p-4 space-y-5">
                  {/* Thông tin chuyến */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin chuyến</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${tripStatusConfig[tripDetail.status].classes}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {tripStatusConfig[tripDetail.status].label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Route size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Tuyến</span>
                          <p className="font-medium text-gray-900 dark:text-white">{tripDetail.route.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Hướng</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tripDetail.direction === Direction.PICK_UP ? 'Chiều đi' : 'Chiều về'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Tài xế</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tripDetail.driver?.fullName || 'Chưa gán'}
                          </p>
                          {tripDetail.driver?.phone && (
                            <p className="text-xs text-gray-500">{tripDetail.driver.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Bus size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Xe</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tripDetail.bus?.licensePlate || 'Chưa gán'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Giờ bắt đầu</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatTime(tripDetail.startTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500">Giờ kết thúc</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatTime(tripDetail.endTime)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Trạm hiện tại (chỉ hiện khi IN_PROGRESS) */}
                    {tripDetail.status === TripStatus.IN_PROGRESS && tripDetail.route.stations.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-blue-500" />
                          <span className="text-gray-500">Trạm hiện tại:</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {tripDetail.route.stations[tripDetail.currentStation]?.name || `Trạm ${tripDetail.currentStation + 1}`}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({tripDetail.currentStation + 1}/{tripDetail.route.stations.length})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bản đồ (chỉ hiện khi IN_PROGRESS và có stations) */}
                  {tripDetail.status === TripStatus.IN_PROGRESS && tripDetail.route.stations.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vị trí trạm dừng</h3>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden h-48 flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <MapPin size={32} className="mx-auto mb-2 text-blue-400" />
                          <p className="text-sm">Đang theo dõi vị trí...</p>
                          <p className="text-xs mt-1">Trạm: {tripDetail.route.stations[tripDetail.currentStation]?.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danh sách điểm danh */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Danh sách điểm danh ({tripDetail.attendances.length})
                      </h3>
                      {canManualAttendance && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Click trạng thái để điểm danh hộ
                        </span>
                      )}
                    </div>

                    {tripDetail.attendances.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                        <User size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có học sinh nào trong chuyến</p>
                      </div>
                    ) : (
                      <div className="space-y-2" ref={dropdownRef}>
                        {tripDetail.attendances.map((att) => {
                          const config = attendanceConfig[att.status];
                          const isUpdating = updatingId === att.id;
                          const isDropdownOpen = activeDropdown === att.id;

                          return (
                            <motion.div
                              key={att.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex items-center gap-3"
                            >
                              {/* Avatar */}
                              <div className="h-9 w-9 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0 border border-gray-200 dark:border-gray-600">
                                {att.student.fullName.charAt(0)}
                              </div>

                              {/* Thông tin học sinh */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {att.student.fullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {att.status === AttendanceStatus.BOARDED && att.boardedAt && `Lên xe: ${formatTime(att.boardedAt)}`}
                                  {att.status === AttendanceStatus.ALIGHTED && att.alightedAt && `Xuống xe: ${formatTime(att.alightedAt)}`}
                                  {att.status === AttendanceStatus.PENDING && 'Chưa lên xe'}
                                  {att.status === AttendanceStatus.ABSENT && 'Nghỉ học'}
                                </p>
                              </div>

                              {/* Badge trạng thái (click để đổi nếu có quyền) */}
                              <div className="relative">
                                {isUpdating ? (
                                  <Loader2 size={16} className="animate-spin text-blue-500" />
                                ) : (
                                  <button
                                    onClick={() => canManualAttendance ? setActiveDropdown(isDropdownOpen ? null : att.id) : undefined}
                                    disabled={!canManualAttendance}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${config.classes} ${canManualAttendance ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                  >
                                    {config.emoji} {config.label}
                                    {canManualAttendance && <ChevronDown size={12} />}
                                  </button>
                                )}

                                {/* Dropdown đổi trạng thái */}
                                <AnimatePresence>
                                  {isDropdownOpen && canManualAttendance && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                      className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1 min-w-[160px]"
                                    >
                                      {Object.entries(attendanceConfig)
                                        .filter(([key]) => key !== att.status)
                                        .map(([key, cfg]) => (
                                          <button
                                            key={key}
                                            onClick={() => handleUpdateAttendance(att, key as AttendanceStatus)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                          >
                                            <span>{cfg.emoji}</span>
                                            <span>{cfg.label}</span>
                                          </button>
                                        ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Không tìm thấy dữ liệu chuyến đi
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
