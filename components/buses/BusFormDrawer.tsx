'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Bus as BusIcon } from 'lucide-react';
import { Bus, CreateBusPayload, UpdateBusPayload } from '@/types/bus';

interface BusFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBusPayload | UpdateBusPayload) => Promise<void>;
  isLoading: boolean;
  initialData: Bus | null;
}

export default function BusFormDrawer({ isOpen, onClose, onSubmit, isLoading, initialData }: BusFormDrawerProps) {
  const [formData, setFormData] = useState<CreateBusPayload>({
    licensePlate: '',
    seatCapacity: 45,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        licensePlate: initialData.licensePlate,
        seatCapacity: initialData.seatCapacity,
        status: initialData.status,
      });
    } else {
      setFormData({ licensePlate: '', seatCapacity: 45, status: 'ACTIVE' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay nền mờ */}
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
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                  <BusIcon size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {initialData ? 'Cập nhật thông tin xe' : 'Thêm xe buýt mới'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Biển số xe *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 29B-123.45"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Số chỗ ngồi *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.seatCapacity}
                  onChange={(e) => setFormData({ ...formData, seatCapacity: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tình trạng xe</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="ACTIVE">Đang hoạt động (Sẵn sàng)</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                </select>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {initialData ? 'Cập nhật xe' : 'Lưu xe mới'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}