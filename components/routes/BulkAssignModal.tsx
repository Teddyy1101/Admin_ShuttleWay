'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarPlus, Clock, Users, Truck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers } from '@/hooks/useUsers';
import { useBuses } from '@/hooks/useBuses';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'CN' },
];

export default function BulkAssignModal({ isOpen, onClose, routeId, onSuccess }: BulkAssignModalProps) {
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    days: [1, 2, 3, 4, 5], // Mặc định T2-T6
    time: '06:00',
    driverId: '',
    busId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data
  const { users, isLoading: isLoadingUsers } = useUsers({ limit: 100 });
  // Giả định role DRIVER sẽ được BE filter, tạm thời type User chưa có field role nên ta lấy toàn bộ hoặc những user active.
  const drivers = users.filter(u => u.isActive); 
  
  const { buses, isLoading: isLoadingBuses } = useBuses({ limit: 100 });
  const activeBuses = buses.filter(b => b.isActive);

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => {
      const isSelected = prev.days.includes(dayValue);
      if (isSelected) {
        return { ...prev, days: prev.days.filter(d => d !== dayValue) };
      } else {
        return { ...prev, days: [...prev.days, dayValue] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.days.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }
    
    if (!formData.driverId || !formData.busId) {
      toast.error('Vui lòng chọn tài xế và xe phân công');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock API call since there's no tripService yet
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const payload = {
        routeId,
        month: formData.month,
        days: formData.days,
        time: formData.time,
        driverId: formData.driverId,
        busId: formData.busId,
      };
      
      console.log('Bulk Assign Payload:', payload);
      
      toast.success('Tạo lịch & phân công tháng thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi tạo lịch');
    } finally {
      setIsSubmitting(false);
    }
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
          className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <CalendarPlus size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Sinh Lịch & Phân Công Hàng Loạt
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Tạo nhanh các chuyến xe cố định trong tháng
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:text-gray-200 dark:hover:bg-gray-700/50 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
            <form id="bulk-assign-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Month Picker */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar size={16} className="text-blue-500" />
                    Tháng áp dụng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Clock size={16} className="text-blue-500" />
                    Giờ xuất phát <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Day Checkboxes */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Ngày áp dụng trong tuần <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.days.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`
                          py-2.5 px-1 rounded-xl text-sm font-medium transition-all shadow-sm
                          ${isSelected 
                            ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10'}
                        `}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignments Section */}
              <div className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                  Phân công mặc định
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Driver Select */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Users size={16} className="text-emerald-500" />
                      Tài xế <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.driverId}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    >
                      <option value="">-- Chọn tài xế --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bus Select */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Truck size={16} className="text-purple-500" />
                      Xe phân công <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.busId}
                      onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                    >
                      <option value="">-- Chọn xe --</option>
                      {activeBuses.map(b => (
                        <option key={b.id} value={b.id}>{b.licensePlate} ({b.seatCapacity} chỗ)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 flex justify-end gap-3 mt-auto">
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
              form="bulk-assign-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 min-w-[170px] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CalendarPlus size={18} />
                  Tạo lịch & Phân công
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
