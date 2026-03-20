'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import RouteEditModal from '@/components/routes/RouteEditModal';
import RouteFormDrawer from '@/components/routes/RouteFormDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Route as RouteIcon, Tag, Edit, Plus } from 'lucide-react';

import { useRoutes } from '@/hooks/useRoute';
import { Route } from '@/types/route';

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      }`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {!isActive && <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5" />}
      {isActive ? 'Hoạt động' : 'Tạm ngưng'}
    </span>
  );
};

export default function RoutesPage() {
  const router = useRouter();
  const { routes, total, page, limit, isLoading, params, updateFilters, changePage, mutate } = useRoutes({ page: 1, limit: 10 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const handleEditClick = (e: React.MouseEvent, route: Route) => {
    e.stopPropagation();
    setSelectedRoute(route);
    setIsEditModalOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilters({ search: value || undefined });
  };

  const formatPrice = (price?: number) => {
    if (price === undefined) return '0 đ';
    return price.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý tuyến đường"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý tuyến', href: '/routes' }
          ]}
        />
        <motion.button
          onClick={() => setIsCreateDrawerOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Thêm tuyến đường</span>
        </motion.button>
      </div>

      <div className="bg-white rounded-l border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden filter-container flex flex-col min-h-[calc(100vh-180px)]">
        {/* Actions Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danh sách tuyến đường</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm focus:border-transparent dark:text-white placeholder-gray-400 transition-colors"
                placeholder="Tìm tên tuyến..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Tuyến</th>
                <th className="px-6 py-4 font-semibold">Mã tuyến</th>
                <th className="px-6 py-4 font-semibold">Giá vé lượt</th>
                <th className="px-6 py-4 font-semibold">Giá vé tháng</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {routes.map((route) => (
                    <motion.tr
                      key={route.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => router.push(`/routes/${route.routeCode}`)}
                        title="Nhấn để xem chi tiết tuyến đường"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                            <RouteIcon size={20} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">Tuyến: {route.name}</div>
                            <div className="text-xs text-gray-500">
                              {route.shiftType === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => router.push(`/routes/${route.routeCode}`)}
                        title="Nhấn để xem chi tiết tuyến đường"
                      >
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {route.routeCode}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => router.push(`/routes/${route.routeCode}`)}
                        title="Nhấn để xem chi tiết tuyến đường"
                      >
                        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <Tag size={14} />
                          {formatPrice(route.singlePrice)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => router.push(`/routes/${route.routeCode}`)}
                        title="Nhấn để xem chi tiết tuyến đường"
                      >
                        <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                          <Tag size={14} />
                          {formatPrice(route.monthlyPrice)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => router.push(`/routes/${route.routeCode}`)}
                        title="Nhấn để xem chi tiết tuyến đường"
                      >
                        <StatusBadge isActive={route.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/routes/${route.routeCode}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={(e) => handleEditClick(e, route)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30 transition-colors ml-2"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {!isLoading && routes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Không tìm thấy tuyến đường nào.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Integration */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalItems={total}
            limit={limit}
            showingCount={routes.length}
            onPageChange={changePage}
          />
        )}
      </div>

      <RouteEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRoute(null);
        }}
        route={selectedRoute}
        onSuccess={() => mutate()}
      />

      {/* Drawer tạo tuyến đường mới */}
      <RouteFormDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </PageWrapper>
  );
}
