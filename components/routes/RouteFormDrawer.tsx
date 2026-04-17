'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Loader2, Route as RouteIcon, Plus, GripVertical, Trash2, MapPin, ChevronDown } from 'lucide-react';
import { CreateRoutePayload, ShiftType, Station } from '@/types/route';
import { routeService } from '@/services/routeService';
import { stationService } from '@/services/stationService';
import toast from 'react-hot-toast';

interface RouteFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Trạm đã chọn (lưu tạm trước khi submit)
interface SelectedStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function RouteFormDrawer({ isOpen, onClose, onSuccess }: RouteFormDrawerProps) {
  const [formData, setFormData] = useState<CreateRoutePayload>({
    name: '',
    shiftType: ShiftType.MORNING,
    estimatedTime: '',
    singlePrice: 0,
    monthlyPrice: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho phần chọn trạm
  const [availableStations, setAvailableStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState('');

  // Reset form khi mở drawer
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        shiftType: ShiftType.MORNING,
        estimatedTime: '',
        singlePrice: 0,
        monthlyPrice: 0,
      });
      setSelectedStations([]);
      setSelectedStationId('');
      fetchAvailableStations();
    }
  }, [isOpen]);

  // Tải danh sách trạm có sẵn từ API
  const fetchAvailableStations = async () => {
    setIsLoadingStations(true);
    try {
      const res = await stationService.getStations({ limit: 200, isActive: true });
      setAvailableStations(res.data?.data || []);
    } catch {
      setAvailableStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Thêm trạm vào danh sách đã chọn
  const handleAddStation = () => {
    if (!selectedStationId) return;
    const station = availableStations.find((s) => s.id === selectedStationId);
    if (!station) return;

    // Kiểm tra trùng lặp
    if (selectedStations.some((s) => s.id === station.id)) {
      toast.error('Trạm này đã được chọn rồi!');
      return;
    }

    setSelectedStations((prev) => [
      ...prev,
      {
        id: station.id,
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
      },
    ]);
    setSelectedStationId('');
  };

  // Xóa trạm khỏi danh sách đã chọn
  const handleRemoveStation = (stationId: string) => {
    setSelectedStations((prev) => prev.filter((s) => s.id !== stationId));
  };

  // Submit: Tạo route kèm danh sách trạm trong cùng 1 payload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra phải có ít nhất 2 trạm
    if (selectedStations.length < 2) {
      toast.error('Tuyến đường phải có ít nhất 2 trạm dừng!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi payload kèm mảng stations (bảng trung gian RouteStation)
      await routeService.createRoute({
        ...formData,
        stations: selectedStations.map((station, index) => ({
          stationId: station.id,
          orderIndex: index + 1,
        })),
      });

      toast.success('Tạo tuyến đường mới thành công!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi tạo tuyến đường');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc danh sách trạm chưa được chọn
  const unselectedStations = availableStations.filter(
    (s) => !selectedStations.some((sel) => sel.id === s.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay nền mờ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <RouteIcon size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Thêm tuyến đường mới
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung Form */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="route-create-form" onSubmit={handleSubmit} className="space-y-5">
                {/* === PHẦN 1: THÔNG TIN TUYẾN === */}
                <div className="space-y-1 mb-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Thông tin tuyến
                  </h3>
                  <p className="text-xs text-gray-400">Điền đầy đủ thông tin cơ bản của tuyến đường</p>
                </div>


                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tên tuyến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Tuyến số 1A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ca tuyến <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.shiftType}
                      onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as ShiftType })}
                      disabled={isSubmitting}
                      className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all pr-10 disabled:opacity-60 cursor-pointer"
                    >
                      <option value={ShiftType.MORNING}>Buổi sáng</option>
                      <option value={ShiftType.AFTERNOON}>Buổi chiều</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thời gian dự kiến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Giá vé lượt (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formData.singlePrice}
                      onChange={(e) => setFormData({ ...formData, singlePrice: Number(e.target.value) })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Giá vé tháng (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* === ĐƯỜNG KẺ PHÂN CÁCH === */}
                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                </div>

                {/* === PHẦN 2: CHỌN TRẠM DỪNG === */}
                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} />
                    Trạm dừng
                    {selectedStations.length > 0 && (
                      <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {selectedStations.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400">Chọn trạm từ danh sách và kéo thả để sắp xếp thứ tự</p>
                </div>

                {/* Dropdown chọn trạm + nút thêm */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedStationId}
                      onChange={(e) => setSelectedStationId(e.target.value)}
                      disabled={isSubmitting || isLoadingStations}
                      className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm disabled:opacity-60 cursor-pointer pr-10"
                    >
                      <option value="">
                        {isLoadingStations
                          ? 'Đang tải...'
                          : `-- Chọn trạm (${unselectedStations.length} khả dụng) --`
                        }
                      </option>
                      {unselectedStations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStation}
                    disabled={!selectedStationId || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20 shrink-0"
                  >
                    <Plus size={16} />
                    Thêm
                  </button>
                </div>

                {/* Danh sách trạm đã chọn — Kéo thả sắp xếp */}
                {selectedStations.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 italic flex items-center gap-1">
                      <GripVertical size={12} /> Kéo thả để thay đổi thứ tự trạm
                    </p>
                    <Reorder.Group
                      axis="y"
                      values={selectedStations}
                      onReorder={setSelectedStations}
                      className="space-y-2"
                    >
                      {selectedStations.map((station, index) => (
                        <Reorder.Item
                          key={station.id}
                          value={station}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          {/* Drag handle */}
                          <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0">
                            <GripVertical size={16} />
                          </div>

                          {/* Số thứ tự */}
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {/* Tên trạm */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate select-none">
                              {station.name}
                            </p>
                            <p className="text-[10px] text-gray-400 select-none">
                              {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                            </p>
                          </div>

                          {/* Nút xóa */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStation(station.id)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors shrink-0 disabled:opacity-50"
                            title="Bỏ chọn trạm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <MapPin size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400">Chưa có trạm nào được chọn</p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="route-create-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                Lưu tuyến mới
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
