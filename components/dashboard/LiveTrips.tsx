'use client';

import { motion } from 'framer-motion';
import { useLiveTrips } from '@/hooks/useDashboard';
import { Bus, MapPin, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function LiveTrips() {
  const { liveTrips, isLoading } = useLiveTrips();

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900 h-full flex flex-col"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Chuyến xe đang chạy
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Các tuyến đang hoạt động ngoài đường
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {liveTrips.length > 0 ? (
          liveTrips.map((trip) => (
            <div 
              key={trip.id} 
              className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-4 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 group"
            >
              {/* Highlight bar on left */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {trip.route?.routeCode || 'N/A'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {trip.route?.name || 'Chuyến xe'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <UserCircle size={14} className="text-gray-400" />
                      <span className="truncate">{trip.driver?.fullName || 'Chưa có tài xế'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <Bus size={14} className="text-gray-400" />
                      <span>{trip.bus?.licensePlate || 'Chưa xếp xe'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                    <MapPin size={12} />
                    Đang chạy
                  </div>
                  {trip.startTime && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Bắt đầu {formatDistanceToNow(new Date(trip.startTime), { addSuffix: true, locale: vi })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3">
            <Bus size={32} className="opacity-20" />
            <p>Hiện không có chuyến xe nào đang chạy</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
