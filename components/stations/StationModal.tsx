'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Save, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Station, CreateStationPayload, UpdateStationPayload } from '@/types/route';
import type { StationMapPickerHandle } from './StationMapPicker';

// Import bản đồ bằng next/dynamic với ssr: false (Leaflet không hỗ trợ SSR)
const StationMapPicker = dynamic(() => import('./StationMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: Station | null;
  // Hàm tạo và cập nhật trạm sẽ được truyền từ hook
  onCreate: (payload: CreateStationPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateStationPayload) => Promise<void>;
}

// Tọa độ mặc định: Trung tâm Hà Nội
const DEFAULT_POSITION: [number, number] = [21.028511, 105.804817];

export default function StationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  onCreate,
  onUpdate,
}: StationModalProps) {
  const isEditMode = !!initialData;

  // State form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref để điều khiển bản đồ (flyTo)
  const mapRef = useRef<StationMapPickerHandle>(null);

  // Pre-fill form khi có initialData (Edit mode) hoặc reset khi Add mode
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAddress('');
      setPosition([initialData.latitude, initialData.longitude]);
    } else {
      setName('');
      setAddress('');
      setPosition(DEFAULT_POSITION);
    }
  }, [initialData, isOpen]);

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && initialData) {
        // Cập nhật trạm dừng
        await onUpdate(initialData.id, {
          name: name.trim(),
          latitude: position[0],
          longitude: position[1],
        });
      } else {
        // Tạo trạm dừng mới - routeId và orderIndex tạm mặc định
        // Frontend sẽ cần bổ sung routeId khi tích hợp vào route
        await onCreate({
          routeId: '',
          name: name.trim(),
          latitude: position[0],
          longitude: position[1],
          orderIndex: 1,
        });
      }
      onSuccess();
      onClose();
    } catch {
      // Lỗi đã được xử lý trong hook (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay mờ nền */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Modal chính */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isEditMode ? 'Cập nhật trạm dừng' : 'Thêm trạm dừng mới'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click vào bản đồ hoặc tìm kiếm để chọn vị trí
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content: 2 cột trên desktop, xếp dọc trên mobile */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Cột trái: Form nhập liệu */}
              <div className="w-full lg:w-[40%] p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800">
                <form id="station-form" onSubmit={handleSubmit} className="space-y-5">
                  {/* Tên trạm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tên trạm <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="VD: Trạm Bến xe Mỹ Đình"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                    />
                  </div>

                  {/* Địa chỉ (tự động fill khi click bản đồ hoặc tìm kiếm) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Địa chỉ
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                      placeholder="Click vào bản đồ để tự động điền địa chỉ"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60 resize-none"
                    />
                  </div>

                  {/* Kinh độ & Vĩ độ (read-only) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Vĩ độ (Lat)
                      </label>
                      <input
                        readOnly
                        type="text"
                        value={position[0].toFixed(6)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Kinh độ (Lng)
                      </label>
                      <input
                        readOnly
                        type="text"
                        value={position[1].toFixed(6)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Cột phải: Bản đồ tương tác (đã tích hợp search bên trong) */}
              <div className="w-full lg:w-[60%] flex-1 min-h-[300px]">
                <StationMapPicker
                  ref={mapRef}
                  position={position}
                  setPosition={setPosition}
                  setAddress={setAddress}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="station-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
