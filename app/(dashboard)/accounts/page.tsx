'use client';

import { useState } from 'react';

import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import ConfirmModal from '@/components/ConfirmModal';
import UserFormDrawer from '@/components/UserFormDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Shield,
  User as UserIcon,
  Car,
  GraduationCap,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Phone,
  Link as LinkIcon,
} from 'lucide-react';

import { useUsers } from '@/hooks/useUsers';
import { Role, User } from '@/types/user';

const formatDateTime = (dateString?: string | Date | null) => {
  if (!dateString) return 'Chưa tạo';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Chưa tạo';
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

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
  const { users, total, isLoading, params, updateFilters, changePage, toggleStatus, deleteAccount, createUser, updateUser } = useUsers({ page: 1, limit: 10 });
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<User | null>(null);
  
  // Custom states for new user drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const confirmDelete = async () => {
    if (accountToDelete) {
      await deleteAccount(accountToDelete);
      setAccountToDelete(null);
    }
  };

  const handleCreateOrUpdateUser = async (data: FormData) => {
    try {
      setIsFormLoading(true);
      if (accountToEdit) {
        await updateUser(accountToEdit.id, data);
      } else {
        await createUser(data);
      }
      setIsDrawerOpen(false);
      setAccountToEdit(null);
    } catch (error) {
      // Error is handled inside the hook (toast)
      console.error(error);
    } finally {
      setIsFormLoading(false);
    }
  };

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
          onClick={() => {
            setAccountToEdit(null);
            setIsDrawerOpen(true);
          }}
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
                <th className="px-6 py-4 font-semibold">Số điện thoại</th>
                <th className="px-6 py-4 font-semibold">Liên kết</th>
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
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
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
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        {account.phone ? (
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                            <Phone size={14} className="text-gray-400" />
                            <span>{account.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa cập nhật</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 min-w-[140px]">
                        {(account as any).role === 'STUDENT' && (account as any).parent && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <LinkIcon size={14} className="text-blue-400" />
                            <span className="truncate max-w-[150px]" title={`Phụ huynh: ${(account as any).parent.fullName}`}>PH: {(account as any).parent.fullName}</span>
                          </div>
                        )}
                        {(account as any).role === 'PARENT' && (account as any).students && (account as any).students.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <LinkIcon size={14} className="text-green-400" />
                            <span className="truncate max-w-[150px]" title={`Học sinh: ${(account as any).students.map((s: any) => s.fullName).join(', ')}`}>
                              HS: {(account as any).students.map((s: any) => s.fullName).join(', ')}
                            </span>
                          </div>
                        )}
                        {!(account as any).parent && (!(account as any).students || (account as any).students.length === 0) && (
                          <span className="text-xs text-gray-400 italic">Không có liên kết</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={account.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge isActive={account.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {account.createdAt ? formatDateTime(account.createdAt) : 'Chưa tạo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <button
                          onClick={() => {
                            setAccountToEdit(account);
                            setIsDrawerOpen(true);
                          }}
                          className="p-2 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors tooltip-trigger"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(account)}
                          className={`p-2 rounded-lg transition-colors tooltip-trigger ${
                            account.isActive 
                              ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30' 
                              : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/30'
                          }`}
                          title={account.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {account.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button
                          onClick={() => setAccountToDelete(account.id)}
                          className="p-2 rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors tooltip-trigger"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              )}
              
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
      </div>
        
      <ConfirmModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa tài khoản"
        description="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác."
        confirmText="Đồng ý xóa"
      />

      {/* User Creation / Update Drawer */}
      <UserFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setAccountToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateUser}
        isLoading={isFormLoading}
        initialData={accountToEdit}
      />
    </PageWrapper>
  );
}
