'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
  Send,
  Users,
  Route,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { notificationService } from '@/services/notificationService';
import { routeService } from '@/services/routeService';
import { tripService } from '@/services/tripService';
import { BroadcastPayload } from '@/types/notification';
import { Role } from '@/types/user';

// Cấu hình các role để chọn đối tượng nhận
const roleOptions: { value: '' | Role; label: string; description: string }[] = [
  { value: '', label: 'Tất cả người dùng', description: 'Gửi cho tất cả học sinh, phụ huynh, tài xế' },
  { value: 'STUDENT', label: 'Học sinh', description: 'Chỉ gửi cho tài khoản học sinh' },
  { value: 'PARENT', label: 'Phụ huynh', description: 'Chỉ gửi cho tài khoản phụ huynh' },
  { value: 'DRIVER', label: 'Tài xế', description: 'Chỉ gửi cho tài khoản tài xế' },
];

export default function SendNotificationPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<'' | Role>('');
  const [routeId, setRouteId] = useState('');
  const [tripId, setTripId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ totalRecipients: number; fcmSentCount: number } | null>(null);

  // Lấy danh sách tuyến đường cho dropdown
  const { data: routesData } = useSWR(
    '/routes-for-broadcast',
    () => routeService.getRoutes({ limit: 100 }),
  );
  const routes = routesData?.data?.data || [];

  // Lấy danh sách chuyến đi cho dropdown (chỉ khi đã chọn tuyến)
  const { data: tripsData } = useSWR(
    routeId ? ['/trips-for-broadcast', routeId] : null,
    () => tripService.getTrips({ routeId, limit: 100 }),
  );
  const trips = tripsData?.data?.data || [];

  // Xử lý gửi thông báo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const payload: BroadcastPayload = {
        title: title.trim(),
        body: body.trim(),
      };

      if (targetRole) payload.targetRole = targetRole;
      if (routeId) payload.routeId = routeId;
      if (tripId) payload.tripId = tripId;

      const result = await notificationService.broadcast(payload);
      setLastResult(result.data);

      if (result.data?.totalRecipients === 0) {
        toast.error(result.message || 'Không tìm thấy người nhận nào phù hợp');
        return;
      }

      toast.success(result.message || 'Gửi thông báo thành công');

      // Reset form
      setTitle('');
      setBody('');
      setTargetRole('');
      setRouteId('');
      setTripId('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi gửi thông báo');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <PageHeader
          title="Gửi thông báo"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý thông báo' },
            { label: 'Gửi thông báo' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form gửi thông báo */}
        <div className="lg:col-span-2">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Soạn thông báo mới</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Điền nội dung và chọn đối tượng nhận</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thông báo lịch nghỉ Tết Nguyên Đán 2026"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  maxLength={200}
                />
                <p className="mt-1.5 text-xs text-gray-400">{title.length}/200 ký tự</p>
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="VD: Nhà trường thông báo lịch nghỉ Tết Nguyên Đán từ ngày 25/01 đến 05/02/2026. Xe buýt sẽ ngừng hoạt động trong thời gian này..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  maxLength={1000}
                />
                <p className="mt-1.5 text-xs text-gray-400">{body.length}/1000 ký tự</p>
              </div>

              {/* Đường kẻ phân cách */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-gray-900 px-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Users size={14} />
                    Chọn đối tượng nhận
                  </span>
                </div>
              </div>

              {/* Chọn vai trò */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lọc theo vai trò
                </label>
                <div className="relative">
                  <select
                    value={targetRole}
                    onChange={(e) => {
                      setTargetRole(e.target.value as '' | Role);
                      // Reset route/trip khi đổi role
                      if (e.target.value !== 'STUDENT') {
                        setRouteId('');
                        setTripId('');
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Lọc theo tuyến đường (hiện khi chọn STUDENT hoặc Tất cả) */}
              {(!targetRole || targetRole === 'STUDENT') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Route size={14} className="inline mr-1.5" />
                      Lọc theo tuyến đường
                    </label>
                    <div className="relative">
                      <select
                        value={routeId}
                        onChange={(e) => {
                          setRouteId(e.target.value);
                          setTripId(''); // Reset trip khi đổi route
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Tất cả tuyến</option>
                        {routes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.routeCode} - {route.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin size={14} className="inline mr-1.5" />
                      Lọc theo chuyến đi
                    </label>
                    <div className="relative">
                      <select
                        value={tripId}
                        onChange={(e) => setTripId(e.target.value)}
                        disabled={!routeId}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Tất cả chuyến</option>
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {new Date(trip.scheduledDate).toLocaleDateString('vi-VN')} — {trip.direction === 'PICK_UP' ? 'Đón' : 'Trả'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Info size={12} />
                Thông báo sẽ được gửi qua FCM push và lưu vào lịch sử
              </p>
              <motion.button
                type="submit"
                disabled={isSending || !title.trim() || !body.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi thông báo
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>

        {/* Sidebar thông tin */}
        <div className="space-y-6">
          {/* Kết quả gửi gần nhất */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl border p-5 ${
                lastResult.totalRecipients > 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {lastResult.totalRecipients > 0 ? (
                  <>
                    <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Đã gửi thành công!</h3>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300">Không tìm thấy người nhận</h3>
                  </>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className={`flex justify-between ${lastResult.totalRecipients > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  <span>Tổng người nhận:</span>
                  <span className="font-bold">{lastResult.totalRecipients}</span>
                </div>
                {lastResult.totalRecipients > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>FCM gửi thành công:</span>
                    <span className="font-bold">{lastResult.fcmSentCount}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Hướng dẫn sử dụng */}
          <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              Hướng dẫn
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Nhập tiêu đề và nội dung thông báo cần gửi</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Chọn đối tượng nhận: theo vai trò, tuyến đường, hoặc chuyến đi cụ thể</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Nhấn &quot;Gửi thông báo&quot; để broadcast qua FCM push notification</span>
              </li>
            </ul>
          </div>

          {/* Thống kê nhanh */}
          <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Lưu ý</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Nếu không chọn bộ lọc, thông báo sẽ gửi cho <strong>tất cả</strong> người dùng (trừ Admin)</p>
              <p>• Bộ lọc tuyến/chuyến chỉ hiển thị khi chọn &quot;Tất cả&quot; hoặc &quot;Học sinh&quot;</p>
              <p>• Mỗi người nhận sẽ có 1 bản ghi thông báo riêng trong hệ thống</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
