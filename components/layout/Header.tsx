'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bell, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Header trên cùng với nút toggle Dark/Light mode
export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tránh lỗi hydration mismatch khi server render
  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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

  return (
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Thông báo"
        >
          <Bell size={20} />
          {/* Badge thông báo */}
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </motion.button>

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
          <motion.div
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 overflow-hidden relative">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={26} className="mt-2 opacity-80" />
              )}
            </div>

            {/* Name and Role */}
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 max-w-[120px] truncate">
                {user?.fullName || 'Đang tải...'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                <UserIcon size={10} />
                {user?.role === 'ADMIN' ? 'Admin' : (user?.role || 'Admin')}
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
                className="rounded-lg absolute right-0 mt-3 w-56 transform overflow-hidden bg-white p-2 shadow-xl dark:bg-gray-900 border-t-1 border-gray-500"
              >
                <div className="px-3 py-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // Navigate to profile logic if needed: router.push('/profile')
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <UserIcon size={16} className="text-gray-400 dark:text-gray-500" />
                  Trang cá nhân
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut size={16} className="text-red-500/80" />
                  Đăng xuất
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
