'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dữ liệu tài xế và xe
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

  if (!mounted) return null;

  return createPortal(
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
            className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-white dark:bg-gray-900 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cập nhật phân công
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Chỉnh sửa tài xế, xe và giờ xuất phát
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              
              {/* Thông tin chuyến đi (chỉ đọc) */}
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

              <form id="edit-assignment-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Giờ bắt đầu */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Clock size={16} className="text-blue-500" />
                    <span>Giờ bắt đầu <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                {/* Hướng di chuyển */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <ArrowRightLeft size={16} className="text-indigo-500" />
                    <span>Hướng di chuyển <span className="text-red-500">*</span></span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFormData(prev => ({ ...prev, direction: Direction.PICK_UP }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                        formData.direction === Direction.PICK_UP
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } disabled:opacity-60`}
                    >
                      Chiều đi
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFormData(prev => ({ ...prev, direction: Direction.DROP_OFF }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                        formData.direction === Direction.DROP_OFF
                          ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } disabled:opacity-60`}
                    >
                      Chiều về
                    </button>
                  </div>
                </div>

                {/* Phân công */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Phân công
                  </h3>

                  {/* Chọn tài xế */}
                  <div>
                    <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Users size={16} className="text-emerald-500" />
                      <span>Tài xế <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.driverId}
                        onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                        disabled={isSubmitting}
                        className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm pr-10 disabled:opacity-60 cursor-pointer"
                      >
                        <option value="">-- Chọn tài xế --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.fullName}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Chọn xe */}
                  <div>
                    <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Truck size={16} className="text-purple-500" />
                      <span>Xe phân công <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.busId}
                        onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                        disabled={isSubmitting}
                        className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm pr-10 disabled:opacity-60 cursor-pointer"
                      >
                        <option value="">-- Chọn xe --</option>
                        {activeBuses.map(b => (
                          <option key={b.id} value={b.id}>{b.licensePlate} ({b.seatCapacity} chỗ)</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="edit-assignment-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
