'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Bus, ArrowRightLeft } from 'lucide-react';
import { TripListItem } from '@/types/trip';
import { tripService } from '@/services/tripService';
import { useBuses } from '@/hooks/useBuses';
import { useUsers } from '@/hooks/useUsers';
import toast from 'react-hot-toast';

interface TripSwapModalProps {
  isOpen: boolean;
  trip: TripListItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TripSwapModal({ isOpen, trip, onClose, onSuccess }: TripSwapModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(trip.driverId || '');
  const [selectedBusId, setSelectedBusId] = useState<string>(trip.busId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách tài xế (role = DRIVER)
  const { users: drivers } = useUsers({ page: 1, limit: 100, role: 'DRIVER' });
  // Lấy danh sách xe (ACTIVE)
  const { buses } = useBuses({ page: 1, limit: 100 });

  // Reset state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedDriverId(trip.driverId || '');
      setSelectedBusId(trip.busId || '');
    }
  }, [isOpen, trip]);

  // Xử lý submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updates: Record<string, string> = {};
      if (selectedDriverId !== (trip.driverId || '')) {
        updates.driverId = selectedDriverId;
      }
      if (selectedBusId !== (trip.busId || '')) {
        updates.busId = selectedBusId;
      }

      if (Object.keys(updates).length === 0) {
        toast('Không có thay đổi nào', { icon: 'ℹ️' });
        onClose();
        return;
      }

      await tripService.updateTrip(trip.id, updates);
      toast.success('Đã đổi xe/tài xế thành công');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi xe/tài xế');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-black z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đổi xe / Tài xế</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin chuyến */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chuyến: <span className="font-semibold text-gray-900 dark:text-white">{trip.route.routeCode} - {trip.route.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tài xế hiện tại: {trip.driver?.fullName || 'Chưa gán'} | Xe: {trip.bus?.licensePlate || 'Chưa gán'}
              </p>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Chọn tài xế */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <User size={14} />
                    Tài xế mới
                  </div>
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60 cursor-pointer"
                >
                  <option value="">— Chọn tài xế —</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName} {driver.phone ? `(${driver.phone})` : ''} {driver.id === trip.driverId ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn xe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bus size={14} />
                    Xe mới
                  </div>
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60 cursor-pointer"
                >
                  <option value="">— Chọn xe —</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.licensePlate} ({bus.seatCapacity} chỗ) {bus.id === trip.busId ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Xác nhận đổi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
