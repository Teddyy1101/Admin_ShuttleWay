'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import PromotionFormDrawer from '@/components/promotions/PromotionFormDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Tag,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Banknote,
  AlertTriangle,
  Filter,
  FilterX
} from 'lucide-react';
import { usePromotions } from '@/hooks/usePromotions';
import { Promotion, PromotionPayload, DiscountType } from '@/types/promotion';

// Định dạng ngày hiển thị
const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Định dạng tiền VNĐ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Huy hiệu trạng thái hoạt động
const ActiveBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
      {isActive ? 'Đang hoạt động' : 'Đã tắt'}
    </span>
  );
};

// Thanh tiến trình lượt sử dụng
const UsageBar = ({ used, total }: { used: number; total: number }) => {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isAlmostFull = percentage >= 80;

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">{used}/{total}</span>
        <span className={`font-semibold ${isAlmostFull ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-1.5 rounded-full ${isAlmostFull
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-blue-500 dark:bg-blue-400'
            }`}
        />
      </div>
    </div>
  );
};

export default function PromotionsPage() {
  const {
    promotions, total, page, limit, isLoading, params,
    updateFilters, changePage, createPromotion, updatePromotion, deletePromotion, toggleStatus,
  } = usePromotions({ page: 1, limit: 10 });

  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [promoToToggle, setPromoToToggle] = useState<Promotion | null>(null);
  const [promoToEdit, setPromoToEdit] = useState<Promotion | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Xử lý xác nhận xóa hoàn toàn
  const confirmDelete = async () => {
    if (promoToDelete) {
      await deletePromotion(promoToDelete);
      setPromoToDelete(null);
    }
  };

  // Xử lý xác nhận bật/tắt trạng thái
  const confirmToggle = async () => {
    if (promoToToggle) {
      await toggleStatus(promoToToggle);
      setPromoToToggle(null);
    }
  };

  // Xử lý tạo mới hoặc cập nhật khuyến mãi
  const handleCreateOrUpdate = async (data: PromotionPayload) => {
    try {
      setIsFormLoading(true);
      if (promoToEdit) {
        await updatePromotion(promoToEdit.id, data);
      } else {
        await createPromotion(data);
      }
      setIsDrawerOpen(false);
      setPromoToEdit(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormLoading(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value || undefined });
  };

  // Cấu hình tabs lọc
  type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE';
  const activeTab: FilterTab = params.isActive === true ? 'ACTIVE' : params.isActive === false ? 'INACTIVE' : 'ALL';
  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ACTIVE', label: 'Đang hoạt động' },
    { id: 'INACTIVE', label: 'Đã tắt' },
  ];

  const handleTabChange = (tabId: FilterTab) => {
    if (tabId === 'ALL') {
      updateFilters({ isActive: undefined });
    } else {
      updateFilters({ isActive: tabId === 'ACTIVE' });
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý khuyến mãi"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Vé & Khuyến mãi' },
            { label: 'Khuyến mãi' },
          ]}
        />
        <motion.button
          onClick={() => { setPromoToEdit(null); setIsDrawerOpen(true); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Thêm mã khuyến mãi</span>
        </motion.button>
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Tabs lọc + Thanh tìm kiếm */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabPromo" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:border-transparent dark:text-white placeholder-gray-400 outline-none"
                placeholder="Tìm theo mã khuyến mãi..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>

            {/* Bộ lọc mở rộng */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${
                  isFilterOpen || params.discountType
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Filter size={16} />
                {params.discountType && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    {/* Overlay để đóng popup khi click ra ngoài */}
                    <div 
                      className="fixed inset-0 z-30"
                      onClick={() => setIsFilterOpen(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">Bộ lọc nâng cao</span>
                        {params.discountType && (
                          <button
                            onClick={() => updateFilters({ discountType: undefined })}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <FilterX size={12} />
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Loại giảm giá
                          </label>
                          <select
                            value={params.discountType || ''}
                            onChange={(e) => updateFilters({ discountType: e.target.value as DiscountType || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="">Tất cả loại giảm</option>
                            <option value="PERCENTAGE">Phần trăm</option>
                            <option value="FIXED">Giá cố định</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bảng danh sách khuyến mãi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã code</th>
                <th className="px-6 py-4 font-semibold">Loại giảm</th>
                <th className="px-6 py-4 font-semibold">Mức giảm</th>
                <th className="px-6 py-4 font-semibold">Lượt sử dụng</th>
                <th className="px-6 py-4 font-semibold">Hiệu lực</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton loading UI
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {promotions.map((promo: Promotion) => (
                    <motion.tr
                      key={promo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Mã code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                            <Tag size={16} />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                            {promo.code}
                          </span>
                        </div>
                      </td>

                      {/* Loại giảm */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${promo.discountType === 'PERCENTAGE'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                          }`}>
                          {promo.discountType === 'PERCENTAGE' ? <Percent size={12} /> : <Banknote size={12} />}
                          {promo.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                        </span>
                      </td>

                      {/* Mức giảm */}
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {promo.discountType === 'PERCENTAGE'
                          ? `${promo.discountValue}%`
                          : formatCurrency(promo.discountValue)
                        }
                      </td>

                      {/* Lượt sử dụng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <UsageBar used={promo.usedCount} total={promo.usageLimit} />
                      </td>

                      {/* Hiệu lực */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            Từ: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDate(promo.validFrom)}</span>
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Đến: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDate(promo.validUntil)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActiveBadge isActive={promo.isActive} />
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          {/* Nút chỉnh sửa */}
                          <button
                            onClick={() => { setPromoToEdit(promo); setIsDrawerOpen(true); }}
                            className="p-2 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          {/* Nút bật/tắt trạng thái */}
                          <button
                            onClick={() => setPromoToToggle(promo)}
                            className={`p-2 rounded-lg transition-colors ${promo.isActive
                                ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30'
                                : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/30'
                              }`}
                            title={promo.isActive ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}
                          >
                            {promo.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          {/* Nút xóa */}
                          <button
                            onClick={() => setPromoToDelete(promo.id)}
                            className="p-2 rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                            title="Xóa khuyến mãi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {/* Trạng thái rỗng */}
              {!isLoading && promotions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Không tìm thấy mã khuyến mãi nào.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalItems={total}
            limit={limit}
            showingCount={promotions.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* Modal xác nhận bật/tắt trạng thái */}
      <ConfirmModal
        isOpen={!!promoToToggle}
        onClose={() => setPromoToToggle(null)}
        onConfirm={confirmToggle}
        title={promoToToggle?.isActive ? 'Xác nhận tắt khuyến mãi' : 'Xác nhận bật khuyến mãi'}
        description={promoToToggle?.isActive
          ? 'Bạn có chắc chắn muốn tắt mã khuyến mãi này? Khách hàng sẽ không thể sử dụng mã này cho đến khi được bật lại.'
          : 'Bạn có chắc chắn muốn bật lại mã khuyến mãi này? Khách hàng sẽ có thể sử dụng mã này ngay lập tức.'
        }
        confirmText={promoToToggle?.isActive ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}
        icon={AlertTriangle}
        variant="warning"
      />

      {/* Modal xác nhận xóa hoàn toàn khuyến mãi */}
      <ConfirmModal
        isOpen={!!promoToDelete}
        onClose={() => setPromoToDelete(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa hoàn toàn"
        description="Bạn có chắc chắn muốn xóa vĩnh viễn mã khuyến mãi này? Toàn bộ dữ liệu liên quan sẽ bị mất và không thể khôi phục."
        confirmText="Xóa vĩnh viễn"
        variant="danger"
      />

      {/* Drawer tạo mới / cập nhật khuyến mãi */}
      <PromotionFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setPromoToEdit(null); }}
        onSubmit={handleCreateOrUpdate}
        isLoading={isFormLoading}
        initialData={promoToEdit}
      />
    </PageWrapper>
  );
}
