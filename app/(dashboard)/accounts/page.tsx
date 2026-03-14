'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Shield,
  User as UserIcon,
  Car,
  GraduationCap,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react';

import { useUsers } from '@/hooks/useUsers';
import { Role, User } from '@/types/user';

const RoleBadge = ({ role }: { role: Role }) => {
  const configs = {
    ADMIN: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield, label: 'Admin' },
    DRIVER: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Car, label: 'Tài xế' },
    PARENT: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: UserIcon, label: 'Phụ huynh' },
    STUDENT: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: GraduationCap, label: 'Học sinh' },
  };
  const config = configs[role];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      isActive 
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {!isActive && <Lock size={10} className="mr-1" />}
      {isActive ? 'Hoạt động' : 'Đã khóa'}
    </span>
  );
};

export default function AccountsPage() {
  const { users, total, isLoading, params, updateFilters, changePage } = useUsers({ page: 1, limit: 10 });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Xử lý Timeout chống Spam Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilters({ search: value || undefined });
  };

  const handleTabChange = (role: Role | 'ALL') => {
    updateFilters({ role: role === 'ALL' ? undefined : role });
  };

  const activeTab = params.role || 'ALL';

  const tabs: { id: Role | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ADMIN', label: 'Admin' },
    { id: 'DRIVER', label: 'Tài xế' },
    { id: 'PARENT', label: 'Phụ huynh' },
    { id: 'STUDENT', label: 'Học sinh' },
  ];

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader 
          title="Quản lý tài khoản"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý tài khoản' }
          ]}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Thêm tài khoản</span>
        </motion.button>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden filter-container">
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto pb-3">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:border-transparent dark:text-white placeholder-gray-400 transition-colors"
                placeholder="Tìm tên, email..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>
            <button className="flex items-center justify-center p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Tài khoản</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Ngày Đăng ký</th>
                <th className="px-6 py-4 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton UI cho Table
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {users.map((account) => (
                  <motion.tr
                    key={account.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                          {account.avatarUrl ? (
                            <img src={account.avatarUrl} alt={account.fullName} className="w-full h-full object-cover" />
                          ) : (
                            account.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{account.fullName}</div>
                          <div className="text-xs text-gray-500">{account.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={account.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge isActive={account.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {account.createdAt || 'Chưa tạo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === account.id ? null : account.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        <AnimatePresence>
                          {openDropdown === account.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden"
                              >
                                <div className="py-1">
                                  <button className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <Edit size={14} className="mr-3 text-gray-400" />
                                    Chỉnh sửa
                                  </button>
                                  {account.isActive ? (
                                    <button className="flex w-full items-center px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                      <Lock size={14} className="mr-3 text-amber-500" />
                                      Khóa tài khoản
                                    </button>
                                  ) : (
                                    <button className="flex w-full items-center px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                      <Lock size={14} className="mr-3 text-emerald-500" />
                                      Mở khóa tài khoản
                                    </button>
                                  )}
                                  <button className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Trash2 size={14} className="mr-3 text-red-500" />
                                    Xóa tài khoản
                                  </button>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              )}
              
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Không tìm thấy tài khoản nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination simple UI */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
          <div>Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{users.length}</span> / {total} tài khoản</div>
          <div className="flex gap-1">
            <button 
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" 
              disabled={params.page === 1}
              onClick={() => changePage((params.page || 1) - 1)}
            >Trước</button>
            <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">{params.page || 1}</button>
            <button 
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              disabled={users.length < (params.limit || 10)}
              onClick={() => changePage((params.page || 1) + 1)}
            >Sau</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
