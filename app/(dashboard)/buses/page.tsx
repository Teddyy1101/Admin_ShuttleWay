'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import BusFormDrawer from '@/components/buses/BusFormDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Bus as BusIcon, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import { useBuses } from '@/hooks/useBuses';
import { Bus, BusStatus, CreateBusPayload, UpdateBusPayload } from '@/types/bus';

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Chưa tạo';
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Huy hiệu thể hiện Tình trạng vật lý của xe (Sẵn sàng / Bảo trì)
const ConditionBadge = ({ status }: { status: BusStatus }) => {
  const isMaintenance = status === 'MAINTENANCE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isMaintenance 
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }`}>
      {isMaintenance ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
      {isMaintenance ? 'Bảo trì' : 'Sẵn sàng'}
    </span>
  );
};

// Huy hiệu thể hiện Tình trạng kinh doanh (Còn khai thác hay đã thanh lý)
const UsageBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      isActive 
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      {isActive ? 'Đang khai thác' : 'Ngừng khai thác'}
    </span>
  );
};

export default function BusesPage() {
  // Đã bỏ toggleStatus vì không dùng nút khóa nữa
  const { buses, total, page, limit, isLoading, params, updateFilters, changePage, deleteBus, createBus, updateBus } = useBuses({ page: 1, limit: 10 });
  
  const [busToDelete, setBusToDelete] = useState<string | null>(null);
  const [busToEdit, setBusToEdit] = useState<Bus | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (busToDelete) {
      await deleteBus(busToDelete);
      setBusToDelete(null);
    }
  };

  const handleCreateOrUpdate = async (data: CreateBusPayload | UpdateBusPayload) => {
    try {
      setIsFormLoading(true);
      if (busToEdit) {
        await updateBus(busToEdit.id, data as UpdateBusPayload);
      } else {
        await createBus(data as CreateBusPayload);
      }
      setIsDrawerOpen(false);
      setBusToEdit(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value || undefined });
  };

  const activeTab = params.status || 'ALL';
  const tabs: { id: BusStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ACTIVE', label: 'Đang hoạt động' },
    { id: 'MAINTENANCE', label: 'Bảo trì' },
  ];

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader 
          title="Quản lý xe buýt"
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Quản lý xe' }]}
        />
        <motion.button
          onClick={() => { setBusToEdit(null); setIsDrawerOpen(true); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Thêm xe mới</span>
        </motion.button>
      </div>

      <div className="bg-white rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => updateFilters({ status: tab.id === 'ALL' ? undefined : tab.id })}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabBus" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
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
                placeholder="Tìm biển số xe..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Biển số xe</th>
                <th className="px-6 py-4 font-semibold">Sức chứa</th>
                <th className="px-6 py-4 font-semibold">Tình trạng</th>
                <th className="px-6 py-4 font-semibold">Khai thác</th>
                <th className="px-6 py-4 font-semibold">Ngày thêm</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {buses.map((bus) => (
                    <motion.tr
                      key={bus.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                            <BusIcon size={18} />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">{bus.licensePlate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{bus.seatCapacity} chỗ</td>
                      <td className="px-6 py-4">
                        <ConditionBadge status={bus.status} />
                      </td>
                      <td className="px-6 py-4">
                        <UsageBadge isActive={bus.isActive} />
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDateTime(bus.createdAt)}</td>
                      {/* Thao tác */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === bus.id ? null : bus.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === bus.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                                >
                                  {/* Chỉnh sửa */}
                                  <button
                                    onClick={() => { setBusToEdit(bus); setIsDrawerOpen(true); setOpenMenuId(null); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <Edit size={15} className="text-blue-500" />
                                    Chỉnh sửa
                                  </button>
                                  {/* Xóa xe */}
                                  <button
                                    onClick={() => { setBusToDelete(bus.id); setOpenMenuId(null); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <Trash2 size={15} />
                                    Xóa xe buýt
                                  </button>
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
              {!isLoading && buses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Search size={32} className="mx-auto text-gray-300 mb-2" />
                    <p>Không tìm thấy xe buýt nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination currentPage={page} totalItems={total} limit={limit} showingCount={buses.length} onPageChange={changePage} />
        )}
      </div>
        
      <ConfirmModal
        isOpen={!!busToDelete}
        onClose={() => setBusToDelete(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa xe buýt"
        description="Bạn có chắc chắn muốn xóa xe buýt này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các chuyến xe đang sử dụng xe này."
        confirmText="Đồng ý xóa"
      />

      <BusFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setBusToEdit(null); }}
        onSubmit={handleCreateOrUpdate}
        isLoading={isFormLoading}
        initialData={busToEdit}
      />
    </PageWrapper>
  );
}