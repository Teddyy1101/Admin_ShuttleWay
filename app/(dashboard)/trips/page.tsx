'use client';

import { useState, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import TripDetailDrawer from '@/components/trips/TripDetailDrawer';
import ConfirmModal from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  CalendarDays,
  Filter,
  Bus,
  User,
  Clock,
  Users,
  XCircle,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react';

import { useTrips } from '@/hooks/useTrips';
import { useRoutes } from '@/hooks/useRoute';
import { TripListItem, TripStatus, AttendanceStatus, Direction } from '@/types/trip';
import { tripService } from '@/services/tripService';
import toast from 'react-hot-toast';
import TripSwapModal from '@/components/trips/TripSwapModal';

// Hàm trả về ngày hiện tại dạng YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Badge trạng thái chuyến đi
const TripStatusBadge = ({ status }: { status: TripStatus }) => {
  const config: Record<TripStatus, { label: string; classes: string }> = {
    [TripStatus.PENDING]: {
      label: 'Chờ chạy',
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    [TripStatus.IN_PROGRESS]: {
      label: 'Đang chạy',
      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    [TripStatus.COMPLETED]: {
      label: 'Hoàn thành',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    [TripStatus.CANCELLED]: {
      label: 'Đã hủy',
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };
  const { label, classes } = config[status] || config[TripStatus.PENDING];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

// Thanh tiến độ điểm danh
const AttendanceProgress = ({ trip }: { trip: TripListItem }) => {
  const total = trip._count.attendances;
  const boarded = trip.attendances.filter(a => a.status === AttendanceStatus.BOARDED || a.status === AttendanceStatus.ALIGHTED).length;

  if (total === 0) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">Chưa có học sinh</span>;
  }

  const percent = Math.round((boarded / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
        <div
          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
        {boarded}/{total}
      </span>
    </div>
  );
};

export default function TripsPage() {
  // Mặc định hiển thị tất cả ngày, Admin có thể lọc theo ngày cụ thể
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');
  // State đóng/mở bộ lọc
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // State sắp xếp: key + direction
  type SortKey = 'default' | 'date' | 'route' | 'time' | 'attendance';
  type SortDir = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Đếm số bộ lọc đang active
  const activeFilterCount = [dateFilter, statusFilter, routeFilter].filter(Boolean).length;

  // Xóa tất cả bộ lọc
  const handleClearFilters = () => {
    setDateFilter('');
    setStatusFilter('');
    setRouteFilter('');
  };

  // Lấy danh sách tuyến cho dropdown lọc
  const { routes } = useRoutes({ page: 1, limit: 100 });

  // Build query params
  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page: 1, limit: 20 };
    if (dateFilter) p.scheduledDate = dateFilter;
    if (statusFilter) p.status = statusFilter;
    if (routeFilter) p.routeId = routeFilter;
    return p;
  }, [dateFilter, statusFilter, routeFilter]);

  const { trips: rawTrips, total, page, limit, isLoading, changePage, mutate } = useTrips(queryParams);

  // ==========================
  // Sắp xếp client-side
  // ==========================

  // Trọng số ưu tiên trạng thái: IN_PROGRESS (0) > PENDING (1) > COMPLETED (2) > CANCELLED (3)
  const statusWeight: Record<TripStatus, number> = {
    [TripStatus.IN_PROGRESS]: 0,
    [TripStatus.PENDING]: 1,
    [TripStatus.COMPLETED]: 2,
    [TripStatus.CANCELLED]: 3,
  };

  // Toggle sắp xếp khi bấm header
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Bấm lại cùng cột → đảo chiều, bấm lần 3 → reset về default
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey('default'); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Icon hiển thị trên header cột
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-gray-400 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-blue-500 ml-1" />
      : <ArrowDown size={14} className="text-blue-500 ml-1" />;
  };

  // Áp dụng sắp xếp lên danh sách trips
  const trips = useMemo(() => {
    const sorted = [...rawTrips];
    sorted.sort((a, b) => {
      // Luôn đẩy trạng thái ưu tiên lên đầu
      const wA = statusWeight[a.status] ?? 9;
      const wB = statusWeight[b.status] ?? 9;
      if (wA !== wB) return wA - wB;

      // Áp dụng tiêu chí sắp xếp phụ
      let cmp = 0;
      switch (sortKey) {
        case 'date': {
          const dA = new Date(a.scheduledDate).getTime() || 0;
          const dB = new Date(b.scheduledDate).getTime() || 0;
          cmp = dA - dB;
          break;
        }
        case 'route': {
          cmp = (a.route.routeCode || '').localeCompare(b.route.routeCode || '');
          break;
        }
        case 'time': {
          const tA = a.startTime ? new Date(a.startTime).getTime() : Infinity;
          const tB = b.startTime ? new Date(b.startTime).getTime() : Infinity;
          cmp = tA - tB;
          break;
        }
        case 'attendance': {
          cmp = (a._count?.attendances || 0) - (b._count?.attendances || 0);
          break;
        }
        default: {
          // Sắp xếp mặc định: ngày tăng dần rồi giờ tăng dần
          const dA = new Date(a.scheduledDate).getTime() || 0;
          const dB = new Date(b.scheduledDate).getTime() || 0;
          cmp = dA - dB;
          if (cmp === 0) {
            const tA = a.startTime ? new Date(a.startTime).getTime() : Infinity;
            const tB = b.startTime ? new Date(b.startTime).getTime() : Infinity;
            cmp = tA - tB;
          }
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [rawTrips, sortKey, sortDir]);

  // State drawer chi tiết
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State modal đổi xe/tài xế
  const [swapTrip, setSwapTrip] = useState<TripListItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // State modal xác nhận hành động
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'complete';
    trip: TripListItem;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Mở drawer chi tiết
  const handleOpenDetail = (trip: TripListItem) => {
    setSelectedTripId(trip.id);
    setIsDrawerOpen(true);
  };

  // Đổi xe/tài xế
  const handleSwap = (trip: TripListItem) => {
    if (trip.status !== TripStatus.PENDING && trip.status !== TripStatus.IN_PROGRESS) {
      toast.error('Chỉ có thể đổi xe/tài xế khi chuyến đang Chờ chạy hoặc Đang chạy');
      return;
    }
    setSwapTrip(trip);
  };

  // Xác nhận hành động (hủy / hoàn thành)
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'cancel') {
        await tripService.adminCancelTrip(confirmAction.trip.id);
        toast.success('Đã hủy chuyến đi thành công');
      } else {
        await tripService.adminCompleteTrip(confirmAction.trip.id);
        toast.success('Đã kết thúc chuyến đi thành công');
      }
      mutate();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // Hàm format giờ — hiển thị giờ Việt Nam (UTC+7)
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    } catch {
      return '—';
    }
  };

  // Hàm format hướng di chuyển
  const formatDirection = (direction: Direction) => {
    return direction === Direction.PICK_UP ? 'Chiều đi' : 'Chiều về';
  };

  // Hàm format ngày dd/MM
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý chuyến đi"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý chuyến đi', href: '/trips' },
          ]}
        />
      </div>

      {/* Container chính */}
      <div className="bg-white rounded-l border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col min-h-[calc(100vh-180px)]">
        {/* Thanh bộ lọc gọn — icon + badge + nút xóa lọc */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Nút toggle bộ lọc */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isFilterOpen || activeFilterCount > 0
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Bộ lọc</span>
                {/* Badge số lọc đang active */}
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </motion.button>

              {/* Hiển thị danh sách chuyến đi */}
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Danh sách chuyến đi
              </h2>
            </div>

            {/* Nút xóa lọc (chỉ hiện khi có filter active) */}
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle size={14} />
                Xóa lọc
              </motion.button>
            )}
          </div>

          {/* Panel bộ lọc — đóng/mở với animation */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                  {/* Lọc theo ngày */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ngày</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:border-blue-500 transition-colors min-w-[160px]"
                    />
                  </div>

                  {/* Lọc theo trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Trạng thái</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:border-blue-500 transition-colors min-w-[140px] appearance-none cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      <option value="PENDING">Chờ chạy</option>
                      <option value="IN_PROGRESS">Đang chạy</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>

                  {/* Lọc theo tuyến */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tuyến</label>
                    <select
                      value={routeFilter}
                      onChange={(e) => setRouteFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:border-blue-500 transition-colors min-w-[200px] appearance-none cursor-pointer"
                    >
                      <option value="">Tất cả tuyến</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.routeCode} - {route.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bảng chuyến đi */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  <button onClick={() => handleSort('route')} className="inline-flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                    Tuyến & Hướng <SortIcon column="route" />
                  </button>
                </th>
                <th className="px-5 py-4 font-semibold">
                  <button onClick={() => handleSort('date')} className="inline-flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                    Ngày <SortIcon column="date" />
                  </button>
                </th>
                <th className="px-5 py-4 font-semibold">Tài xế & Xe</th>
                <th className="px-5 py-4 font-semibold">
                  <button onClick={() => handleSort('time')} className="inline-flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                    Giờ xuất phát <SortIcon column="time" />
                  </button>
                </th>
                <th className="px-5 py-4 font-semibold">
                  <button onClick={() => handleSort('attendance')} className="inline-flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                    Tiến độ <SortIcon column="attendance" />
                  </button>
                </th>
                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                <th className="px-5 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
              {isLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {trips.map((trip: TripListItem) => (
                    <motion.tr
                      key={trip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(trip)}
                    >
                      {/* Tuyến & Hướng */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold">
                            <CalendarDays size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {trip.route.routeCode}: {trip.route.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDirection(trip.direction)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ngày */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                          <CalendarDays size={14} className="text-gray-400" />
                          {formatDate(trip.scheduledDate)}
                        </div>
                      </td>

                      {/* Tài xế & Xe */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-gray-100">
                            <User size={14} className="text-gray-400" />
                            {trip.driver?.fullName || <span className="text-gray-400 italic">Chưa gán</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Bus size={13} className="text-gray-400" />
                            {trip.bus?.licensePlate || <span className="italic">Chưa gán xe</span>}
                          </div>
                        </div>
                      </td>

                      {/* Giờ xuất phát */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                          <Clock size={14} className="text-gray-400" />
                          {formatTime(trip.startTime)}
                        </div>
                      </td>

                      {/* Tiến độ */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <AttendanceProgress trip={trip} />
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TripStatusBadge status={trip.status} />
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === trip.id ? null : trip.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === trip.id && (
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
                                    onClick={() => { handleOpenDetail(trip); setOpenMenuId(null); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <Eye size={15} className="text-blue-500" />
                                    Xem chi tiết
                                  </button>

                                  {/* Đổi xe/tài xế - chỉ PENDING/IN_PROGRESS */}
                                  {(trip.status === TripStatus.PENDING || trip.status === TripStatus.IN_PROGRESS) && (
                                    <button
                                      onClick={() => { handleSwap(trip); setOpenMenuId(null); }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                      <Users size={15} className="text-amber-500" />
                                      Đổi xe / Tài xế
                                    </button>
                                  )}

                                  {/* Kết thúc chuyến - chỉ IN_PROGRESS */}
                                  {trip.status === TripStatus.IN_PROGRESS && (
                                    <button
                                      onClick={() => { setConfirmAction({ type: 'complete', trip }); setOpenMenuId(null); }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                      <CheckCircle2 size={15} />
                                      Kết thúc chuyến
                                    </button>
                                  )}

                                  {/* Hủy chuyến - PENDING/IN_PROGRESS */}
                                  {(trip.status === TripStatus.PENDING || trip.status === TripStatus.IN_PROGRESS) && (
                                    <button
                                      onClick={() => { setConfirmAction({ type: 'cancel', trip }); setOpenMenuId(null); }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <XCircle size={15} />
                                      Hủy chuyến
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

              {/* Empty state */}
              {!isLoading && trips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Không tìm thấy chuyến đi nào cho ngày và bộ lọc đã chọn.</p>
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
            showingCount={trips.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* Drawer chi tiết chuyến đi */}
      <TripDetailDrawer
        isOpen={isDrawerOpen}
        tripId={selectedTripId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTripId(null);
        }}
        onDataChanged={() => mutate()}
      />

      {/* Modal đổi xe/tài xế */}
      {swapTrip && (
        <TripSwapModal
          isOpen={!!swapTrip}
          trip={swapTrip}
          onClose={() => setSwapTrip(null)}
          onSuccess={() => {
            mutate();
            setSwapTrip(null);
          }}
        />
      )}

      {/* Modal xác nhận hủy / hoàn thành */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'cancel' ? 'Hủy chuyến đi?' : 'Kết thúc chuyến đi?'}
        description={
          confirmAction?.type === 'cancel'
            ? 'Chuyến đi sẽ bị hủy và thông báo sẽ được gửi đến toàn bộ phụ huynh. Hành động này không thể hoàn tác.'
            : 'Chuyến đi sẽ được đánh dấu hoàn thành. Hành động này không thể hoàn tác.'
        }
        confirmText={actionLoading ? 'Đang xử lý...' : 'Đồng ý'}
        icon={confirmAction?.type === 'cancel' ? XCircle : CheckCircle2}
        variant={confirmAction?.type === 'cancel' ? 'danger' : 'info'}
      />
    </PageWrapper>
  );
}
