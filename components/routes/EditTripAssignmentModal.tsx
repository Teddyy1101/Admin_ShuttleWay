'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, Users, Truck, Calendar as CalendarIcon, AlertCircle, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers } from '@/hooks/useUsers';
import { useBuses } from '@/hooks/useBuses';
import { tripService } from '@/services/tripService';
import { Trip, Direction } from '@/types/route';

// Kiểu dữ liệu cho tripData truyền từ component cha
interface TripDataPayload extends Trip {
  start: Date;
  timeString: string;
}

interface EditTripAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: TripDataPayload | null;
  onSuccess?: () => void;
}

export default function EditTripAssignmentModal({ isOpen, onClose, tripData, onSuccess }: EditTripAssignmentModalProps) {
  const [formData, setFormData] = useState({
    driverId: '',
    busId: '',
    startTime: '',
    direction: Direction.PICK_UP as Direction,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data
  const { users } = useUsers({ limit: 100, role: 'DRIVER' });
  const drivers = users.filter(u => u.isActive); 
  
  const { buses } = useBuses({ limit: 100 });
  const activeBuses = buses.filter(b => b.isActive);

  useEffect(() => {
    if (tripData && isOpen) {
      setFormData({
        driverId: tripData.driverId || '',
        busId: tripData.busId || '',
        startTime: tripData.timeString || '',
        direction: tripData.direction || Direction.PICK_UP,
      });
    }
  }, [tripData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.driverId || !formData.busId) {
      toast.error('Vui lòng chọn đầy đủ tài xế và xe');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Xây dựng payload cập nhật
      const payload: {
        driverId: string;
        busId: string;
        direction: string;
        startTime?: string;
      } = {
        driverId: formData.driverId,
        busId: formData.busId,
        direction: formData.direction,
      };

      // Nếu có thay đổi giờ bắt đầu, chuyển thành ISO datetime
      if (formData.startTime && tripData) {
        const dateStr = tripData.scheduledDate.split('T')[0];
        payload.startTime = `${dateStr}T${formData.startTime}:00.000Z`;
      }

      await tripService.updateTrip(tripData!.id, payload);
      
      toast.success('Cập nhật phân công thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi cập nhật phân công');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Cập nhật phân công
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:text-gray-200 dark:hover:bg-gray-700/50 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 overflow-y-auto">
            
            {/* Read-only Trip Info */}
            {tripData && (
              <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Thông tin xuất phát</h3>
                    <div className="mt-2 space-y-1.5 text-sm text-blue-800 dark:text-blue-200/80">
                      <p className="flex items-center gap-2">
                        <CalendarIcon size={14} className="opacity-70" />
                        Ngày: <strong className="font-medium text-blue-950 dark:text-white">{formatDate(tripData.start)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form id="edit-assignment-form" onSubmit={handleSubmit} className="space-y-5">

              {/* Giờ bắt đầu */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Clock size={16} className="text-blue-500" />
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Hướng di chuyển */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <ArrowRightLeft size={16} className="text-indigo-500" />
                  Hướng di chuyển <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, direction: Direction.PICK_UP }))}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      formData.direction === Direction.PICK_UP
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                    }`}
                  >
                    Chiều đi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, direction: Direction.DROP_OFF }))}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      formData.direction === Direction.DROP_OFF
                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                    }`}
                  >
                    Chiều về
                  </button>
                </div>
              </div>
              
              {/* Driver Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Users size={16} className="text-emerald-500" />
                  Tài xế mới <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                >
                  <option value="">-- Chọn tài xế mới --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Bus Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Truck size={16} className="text-purple-500" />
                  Xe mới <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.busId}
                  onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                >
                  <option value="">-- Chọn xe mới --</option>
                  {activeBuses.map(b => (
                    <option key={b.id} value={b.id}>{b.licensePlate} ({b.seatCapacity} chỗ)</option>
                  ))}
                </select>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="edit-assignment-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
