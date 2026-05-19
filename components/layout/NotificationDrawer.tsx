'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarX, CreditCard, BellOff } from 'lucide-react';
import { AdminNotification } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  isLoading: boolean;
  onNotificationClick?: (notif: AdminNotification) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  isLoading,
  onNotificationClick,
}: NotificationDrawerProps) {
  const router = useRouter();
  // Ngăn cuộn trang khi mở drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: AdminNotification) => {
    onClose();
    if (onNotificationClick) {
      onNotificationClick(notif);
    } else {
      if (notif.type === 'LEAVE_REQUEST') {
        router.push('/requests/absence');
      } else {
        router.push('/transactions');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
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
            className="fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tất cả thông báo
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded dark:bg-gray-800 w-3/4" />
                        <div className="h-3 bg-gray-200 rounded dark:bg-gray-800 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notif) => {
                    const isLeave = notif.type === 'LEAVE_REQUEST';
                    const Icon = isLeave ? CalendarX : CreditCard;
                    const iconColor = isLeave ? 'text-orange-500 bg-orange-100' : 'text-emerald-500 bg-emerald-100';

                    return (
                      <button
                        key={`${notif.type}-${notif.id}`}
                        onClick={() => handleNotificationClick(notif)}
                        className="flex w-full items-start gap-4 rounded-xl p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor} dark:bg-opacity-20`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {notif.description}
                          </p>
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 pt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <BellOff size={48} className="mb-4 opacity-20" />
                  <p>Không có thông báo nào</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
