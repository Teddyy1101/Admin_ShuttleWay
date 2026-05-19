'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  Bus,
  MapPin,
  Route,
  Ticket,
  BellRing,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ReceiptText,
  Send,
  History,
  Headset,
  CalendarX,
  LifeBuoy,
  CalendarDays,
} from 'lucide-react';

// Cấu trúc dữ liệu menu linh hoạt có hỗ trợ sub-menu
type MenuItem = {
  href?: string;
  label: string;
  icon: any;
  subItems?: { href: string; label: string; icon: any }[];
};

const menuItems: MenuItem[] = [
  { href: '/', label: 'Trang chủ', icon: LayoutDashboard },
  { href: '/accounts', label: 'Quản lý tài khoản', icon: Users },
  {
    label: 'Quản lý vận hành',
    icon: Settings,
    subItems: [
      { href: '/buses', label: 'Quản lý xe', icon: Bus },
      { href: '/stations', label: 'Quản lý trạm', icon: MapPin },
      { href: '/routes', label: 'Quản lý tuyến', icon: Route },
      { href: '/trips', label: 'Quản lý chuyến đi', icon: CalendarDays }
    ],
  },
  {
    label: 'Quản lý vé & khuyến mãi',
    icon: Ticket,
    subItems: [
      { href: '/tickets', label: 'Danh sách vé', icon: CreditCard },
      { href: '/promotions', label: 'Khuyến mãi', icon: Ticket },
    ]
  },
  {
    label: 'Quản lý thông báo',
    icon: BellRing,
    subItems: [
      { href: '/notifications/send', label: 'Gửi thông báo', icon: Send },
      { href: '/notifications/history', label: 'Lịch sử', icon: History },
    ]
  },
  {
    label: 'Yêu cầu & Hỗ trợ',
    icon: Headset,
    subItems: [
      { href: '/requests/absence', label: 'Xin nghỉ', icon: CalendarX },
      { href: '/requests/support', label: 'Hỗ trợ', icon: LifeBuoy },
    ]
  },
  { href: '/transactions', label: 'Lịch sử giao dịch', icon: ReceiptText }
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// Sidebar bên trái với hiệu ứng thu/phóng framer-motion và nested menu
export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Tự động mở menu cha nếu có menu con đang active lúc load trang
  useEffect(() => {
    const newExpanded = { ...expandedMenus };
    let hasChanges = false;

    menuItems.forEach((item) => {
      if (item.subItems?.some(sub => pathname.startsWith(sub.href))) {
        if (!newExpanded[item.label]) {
          newExpanded[item.label] = true;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) setExpandedMenus(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSubMenu = (label: string) => {
    if (isCollapsed) return; // Nếu đang thu gọn thì không bấm mở accordion được
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900"
    >
      {/* Logo / Tiêu đề */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700/50 shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent whitespace-nowrap">
                Shuttle Way
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nút toggle thu/phóng */}
        <motion.button
          suppressHydrationWarning
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const hasSubmenu = !!item.subItems;
            const isMenuExpanded = expandedMenus[item.label] && !isCollapsed;

            // Check active status
            const isItemActive = !hasSubmenu && pathname === item.href;
            const isChildActive = hasSubmenu && item.subItems!.some(sub => pathname.startsWith(sub.href));
            const isActive = isItemActive || isChildActive;

            const Icon = item.icon;

            return (
              <li key={item.label} className="relative">
                {hasSubmenu ? (
                  // Menu có mục con
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={`w-full group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon
                        size={18}
                        className={`flex-shrink-0 transition-colors ${isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300'
                          }`}
                      />

                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-left flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform duration-300 ${isMenuExpanded ? '-rotate-180' : ''}`}
                      />
                    )}
                  </button>
                ) : (
                  // Menu đơn (Trang chủ)
                  <Link
                    href={item.href!}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={`flex-shrink-0 transition-colors ${isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300'
                        }`}
                    />

                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                )}

                {/* Danh sách menu con */}
                <AnimatePresence>
                  {hasSubmenu && isMenuExpanded && !isCollapsed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden ml-9 pl-2 border-l border-gray-100 dark:border-gray-800 mt-1 space-y-1"
                    >
                      {item.subItems!.map((sub) => {
                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                        const SubIcon = sub.icon;
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all
                                ${isSubActive
                                  ? 'text-blue-600 font-semibold bg-gray-50 dark:bg-gray-800/50 dark:text-blue-400'
                                  : 'text-gray-500 font-normal hover:text-gray-900 hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/30'
                                }
                              `}
                            >
                              <SubIcon size={14} className={isSubActive ? 'text-blue-500' : 'text-gray-400'} />
                              <span>{sub.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer sidebar */}
      <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700/50 shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-400 dark:text-gray-500 text-center"
            >
              © 2026 ShuttleWay
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #374151;
        }
      `}} />
    </motion.aside>
  );
}
