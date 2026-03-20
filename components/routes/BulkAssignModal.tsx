'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarPlus, Clock, Users, Truck, Calendar, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers } from '@/hooks/useUsers';
import { useBuses } from '@/hooks/useBuses';
import { tripService } from '@/services/tripService';
import { Route, Direction, ShiftType } from '@/types/route';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route;
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

export default function BulkAssignModal({ isOpen, onClose, route, onSuccess }: BulkAssignModalProps) {
  // Xác định xem tuyến đường có phải ca chiều không
  const isAfternoonShift = route.shiftType === ShiftType.AFTERNOON;
  // Giờ mặc định: ca sáng = 06:00, ca chiều = 13:00
  const defaultTime = isAfternoonShift ? '13:00' : '06:00';

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    days: [1, 2, 3, 4, 5], // Mặc định T2-T6
    time: defaultTime,
    direction: Direction.PICK_UP, // Mặc định chiều đón
    driverId: '',
    busId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data
  const { users, isLoading: isLoadingUsers } = useUsers({ limit: 100, role: 'DRIVER' });
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
      const [year, month] = formData.month.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const validDates: Date[] = [];

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i);
        // getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
        if (formData.days.includes(date.getDay())) {
          validDates.push(date);
        }
      }

      const promises = validDates.map(date => {
        const dateStr = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0')
        ].join('-');

        let startTimeStr = undefined;
        if (formData.time) {
          startTimeStr = `${dateStr}T${formData.time}:00.000Z`; // Construct ISO datetime
        }

        return tripService.createTrip({
          routeId: route.id,
          busId: formData.busId,
          driverId: formData.driverId,
          direction: formData.direction,
          scheduledDate: dateStr,
          startTime: startTimeStr,
        });
      });

      await Promise.all(promises);

      toast.success('Tạo lịch & phân công tháng thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo lịch';
      if (Array.isArray(errorMsg)) {
        toast.error(errorMsg.join(', '));
      } else {
        toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setIsSubmitting(false);
    }
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
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Window */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Phân công lịch trình
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tạo lịnh trình phân công tài xế, xe theo tháng
                  </p>
                </div>
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
              <form id="bulk-assign-form" onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Month Picker */}
                  <div>
                    <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar size={16} className="text-blue-500" />
                      <span>Tháng áp dụng <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="month"
                      required
                      value={formData.month}
                      onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                    />
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock size={16} className="text-blue-500" />
                      <span>Giờ xuất phát <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      min={isAfternoonShift ? '12:00' : undefined}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (isAfternoonShift && newTime < '12:00') {
                          toast.error('Ca chiều chỉ được chọn giờ từ 12:00 CH trở đi');
                          return;
                        }
                        setFormData(prev => ({ ...prev, time: newTime }));
                      }}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60"
                    />
                    {isAfternoonShift && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Tuyến đường này thuộc ca chiều — chỉ chọn giờ từ 12:00 trở đi
                      </p>
                    )}
                  </div>
                </div>

                {/* Chọn hướng: Chiều đi / Chiều về */}
                <div>
                  <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <ArrowRightLeft size={16} className="text-indigo-500" />
                    <span>Hướng chuyến <span className="text-red-500">*</span></span>
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

                {/* Day Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày áp dụng trong tuần <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = formData.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleDayToggle(day.value)}
                          className={`
                            py-2 px-1 rounded-lg text-sm font-medium transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                            disabled:opacity-60
                          `}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignments Section */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 space-y-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Phân công mặc định
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Driver Select */}
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

                    {/* Bus Select */}
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
                form="bulk-assign-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CalendarPlus size={16} />
                    Tạo lịch & Phân công
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

