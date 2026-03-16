'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, MapPin, Save, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { searchAddress } from '@/lib/geocoder';
import { stationService } from '@/services/stationService';
import { Station } from '@/types/route';
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

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  currentStationCount: number; // Số trạm hiện tại để tính orderIndex mặc định
  existingStationIds: string[]; // Danh sách ID các trạm đã có trong tuyến
  onSuccess: () => void; // Callback sau khi tạo trạm thành công (mutate SWR)
}

const DEFAULT_POSITION: [number, number] = [21.039861, 105.741825];

export default function AddStationModal({
  isOpen,
  onClose,
  routeId,
  currentStationCount,
  existingStationIds,
  onSuccess,
}: AddStationModalProps) {
  // State form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION);
  const [orderIndex, setOrderIndex] = useState(currentStationCount + 1);
  const [availableStations, setAvailableStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<StationMapPickerHandle>(null);

  // Tải danh sách trạm có sẵn khi mở modal (lọc bỏ trạm đã thuộc tuyến)
  useEffect(() => {
    if (!isOpen) return;

    const fetchStations = async () => {
      setIsLoadingStations(true);
      try {
        const res = await stationService.getStations({ limit: 100, isActive: true });
        setAvailableStations(res.data?.data || []);
      } catch {
        setAvailableStations([]);
      } finally {
        setIsLoadingStations(false);
      }
    };

    fetchStations();
  }, [isOpen, existingStationIds]);

  // Khi chọn một trạm từ dropdown
  const handleSelectStation = (stationId: string) => {
    if (!stationId) return;
    const station = availableStations.find((s) => s.id === stationId);
    if (!station) return;
    setName(station.name);
    setPosition([station.latitude, station.longitude]);
    setAddress('');
    mapRef.current?.flyTo(station.latitude, station.longitude);
  };

  // Hàm xử lý tìm kiếm địa chỉ (Geocoding)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchAddress(searchQuery);
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);

        // Cập nhật vị trí marker và địa chỉ trên form
        setPosition([newLat, newLon]);
        setAddress(display_name);
        mapRef.current?.flyTo(newLat, newLon);
      } else {
        toast.error('Không tìm thấy địa điểm nào phù hợp.');
      }
    } catch {
      toast.error('Lỗi khi tìm kiếm địa chỉ.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Hàm xử lý submit form tạo trạm dừng
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên trạm dừng.');
      return;
    }
    setIsSubmitting(true);
    try {
      await stationService.createStation({
        routeId,
        name: name.trim(),
        latitude: position[0],
        longitude: position[1],
        orderIndex,
      });

      toast.success('Thêm trạm dừng thành công!');
      onSuccess();
      handleReset();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi thêm trạm dừng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form về trạng thái ban đầu
  const handleReset = () => {
    setName('');
    setAddress('');
    setPosition(DEFAULT_POSITION);
    setOrderIndex(currentStationCount + 1);
    setSearchQuery('');
  };

  // Hàm xử lý nhấn Enter trong ô tìm kiếm
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
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
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thêm trạm dừng mới</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click vào bản đồ hoặc tìm kiếm để chọn vị trí</p>
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
                <form id="add-station-form" onSubmit={handleSubmit} className="space-y-5">
                  {/* Dropdown chọn trạm có sẵn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Chọn trạm có sẵn
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => handleSelectStation(e.target.value)}
                        disabled={isSubmitting || isLoadingStations}
                        defaultValue=""
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          {isLoadingStations
                            ? 'Đang tải danh sách...'
                            : `-- Chọn trạm (${availableStations.filter(s => !existingStationIds.includes(s.id)).length} trạm khả dụng) --`
                          }
                        </option>
                        {availableStations.map((s) => {
                          const isExisting = existingStationIds.includes(s.id);
                          return (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={isExisting}
                              className={isExisting ? 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50' : ''}
                            >
                              {s.name} {isExisting ? '(Đã có trong tuyến)' : `(${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)})`}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Hoặc nhập thông tin thủ công bên dưới
                    </p>
                  </div>

                  {/* Đường kẻ phân cách */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white dark:bg-gray-900 text-gray-400">hoặc nhập thủ công</span>
                    </div>
                  </div>

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
                      placeholder="VD: Trạm Công viên Lê Thị Riêng"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                    />
                  </div>

                  {/* Địa chỉ (tự động fill khi click bản đồ) */}
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

                  {/* Thứ tự trạm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Thứ tự trạm <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                    />
                  </div>
                </form>
              </div>

              {/* Cột phải: Bản đồ tương tác */}
              <div className="w-full lg:w-[60%] flex flex-col flex-1 lg:flex-none">
                {/* Bản đồ */}
                <div className="flex-1 min-h-[300px]">
                  <StationMapPicker
                    ref={mapRef}
                    position={position}
                    setPosition={setPosition}
                    setAddress={setAddress}
                  />
                </div>
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
                form="add-station-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu trạm dừng
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
