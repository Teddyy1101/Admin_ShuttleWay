'use client';

import { motion } from 'framer-motion';
import { useRecentActivities } from '@/hooks/useDashboard';
import { Ticket, Headphones, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function RecentActivities() {
  const { activities, isLoading } = useRecentActivities();

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900 h-full flex flex-col"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-emerald-500" />
            Hoạt động gần đây
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cập nhật thời gian thực
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activities.length > 0 ? (
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
            {activities.map((activity, index) => {
              const isTicket = activity.type === 'TICKET';
              const Icon = isTicket ? Ticket : Headphones;
              
              return (
                <div key={activity.id} className="relative flex items-start gap-4">
                  {/* Icon Node */}
                  <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-white dark:ring-gray-900 ${
                    isTicket 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col flex-1 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {activity.title}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-gray-400 dark:text-gray-500">
            Chưa có hoạt động nào
          </div>
        )}
      </div>
    </motion.div>
  );
}
