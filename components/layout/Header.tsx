'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bell, LogOut, User as UserIcon, ChevronDown, CalendarX, CreditCard, BellOff } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotifications } from '@/hooks/useDashboard';
import NotificationDrawer from './NotificationDrawer';
import NotificationDetailModal from './NotificationDetailModal';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { AdminNotification } from '@/types/dashboard';

// Header trên cùng với nút toggle Dark/Light mode
export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  
  // 1. Lấy thêm checkAuth và isLoading từ Zustand
  const { user, logout, checkAuth, isLoading: isAuthLoading } = useAuth();
  const { notifications, isLoading: isNotifLoading } = useAdminNotifications((notif) => {
    setSelectedNotification(notif);
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 2. Chạy checkAuth khi component mount (Khắc phục lỗi F5)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Tránh lỗi hydration mismatch khi server render
  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    setIsNotifDropdownOpen(false);
    setIsDrawerOpen(false);
    setSelectedNotification(notif);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
        {/* Tiêu đề */}
        <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Bảng điều khiển
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hệ thống quản lý xe buýt trường học
        </p>
      </div>

      {/* Phần bên phải */}
      <div className="flex items-center gap-3">
        {/* Nút thông báo */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Thông báo"
          >
            <Bell size={20} />
            {/* Badge thông báo */}
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </motion.button>

          {/* Dropdown Thông báo */}
          <AnimatePresence>
            {isNotifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ originY: 0 }}
                className="absolute right-0 mt-3 w-80 transform overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 z-50"
              >
                {/* Mũi tên trỏ nhọn lên icon chuông */}
                <div className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900" />
                
                <div className="relative z-10 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Thông báo</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                      Mới nhất
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {isNotifLoading ? (
                      <div className="p-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-3 bg-gray-200 rounded dark:bg-gray-800 w-3/4" />
                              <div className="h-2 bg-gray-200 rounded dark:bg-gray-800 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.slice(0, 5).map((notif) => {
                          const isLeave = notif.type === 'LEAVE_REQUEST';
                          const Icon = isLeave ? CalendarX : CreditCard;
                          const iconColor = isLeave ? 'text-orange-500 bg-orange-100' : 'text-emerald-500 bg-emerald-100';

                          return (
                            <button
                              key={`${notif.type}-${notif.id}`}
                              onClick={() => handleNotificationClick(notif)}
                              className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColor} dark:bg-opacity-20`}>
                                <Icon size={14} />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {notif.description}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                        <BellOff size={24} className="mb-2 opacity-20" />
                        <p className="text-sm">Không có thông báo mới</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-2 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setIsNotifDropdownOpen(false);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nút toggle Dark/Light mode với hiệu ứng xoay */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mounted && (
              <motion.div
                key={isDark ? 'dark' : 'light'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {isDark ? (
                  <Sun size={20} className="text-amber-400" />
                ) : (
                  <Moon size={20} className="text-slate-700" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {isAuthLoading ? (
            // 3. Hiệu ứng Skeleton Loading khi đang load data
            <div className="flex items-center gap-3 py-1 px-2">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="hidden sm:flex flex-col gap-2">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
                <div className="h-2 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                whileHover={{ opacity: 0.8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 overflow-hidden relative font-bold">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    // 4. Áp dụng hàm getUserInitials
                    <span>{getUserInitials(user?.fullName || '')}</span>
                  )}
                </div>

                {/* Name and Role */}
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 max-w-[120px] truncate">
                    {user?.fullName || 'Người dùng'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                    <UserIcon size={10} />
                    {user?.role === 'ADMIN' ? 'Quản trị viên' : (user?.role || 'Admin')}
                  </span>
                </div>

                {/* Chevron */}
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? '-rotate-180' : ''}`} />
              </motion.div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ originY: 0 }}
                    className="rounded-lg absolute right-0 mt-3 w-56 transform overflow-hidden bg-white p-2 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="px-3 py-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 rounded-md"
                    >
                      <UserIcon size={16} className="text-gray-400 dark:text-gray-500" />
                      Trang cá nhân
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-md mt-1"
                    >
                      <LogOut size={16} className="text-red-500/80" />
                      Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </header>

      <NotificationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        notifications={notifications}
        isLoading={isNotifLoading}
        onNotificationClick={handleNotificationClick}
      />

      <NotificationDetailModal 
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </>
  );
}