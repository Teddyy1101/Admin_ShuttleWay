'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import StationModal from '@/components/stations/StationModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  CirclePause,
  CirclePlay,
  MapPin,
  Navigation,
} from 'lucide-react';
import { useStations } from '@/hooks/useStations';
import { Station } from '@/types/route';

export default function StationsPage() {
  const {
    stations,
    total,
    page,
    limit,
    isLoading,
    params,
    updateFilters,
    changePage,
    createStation,
    updateStation,
    toggleStationStatus,
    deleteStation,
  } = useStations({ page: 1, limit: 10 });

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationToToggle, setStationToToggle] = useState<Station | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc danh sách theo tên trạm (client-side)
  const filteredStations = searchTerm
    ? stations.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : stations;
  const handleOpenAdd = () => {
    setSelectedStation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (station: Station) => {
    setSelectedStation(station);
    setIsModalOpen(true);
  };

  const confirmToggle = async () => {
    if (stationToToggle) {
      await toggleStationStatus(stationToToggle);
      setStationToToggle(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Quản lý trạm dừng"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý trạm dừng' },
          ]}
        />
        <motion.button
          onClick={handleOpenAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Thêm trạm mới</span>
        </motion.button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden dark:bg-gray-900 flex flex-col">
        {/* Thanh Search */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder-gray-400 transition-all"
              placeholder="Tìm kiếm theo tên trạm..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tổng cộng: <span className="font-semibold text-gray-900 dark:text-white">{total}</span> trạm dừng
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold w-12">#</th>
                <th className="px-6 py-4 font-semibold">Tên trạm</th>
                <th className="px-6 py-4 font-semibold">Tọa độ</th>
                <th className="px-6 py-4 font-semibold">Thứ tự</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton UI
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-6" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {filteredStations.map((station, index) => (
                    <motion.tr
                      key={station.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      {/* STT */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-400">
                        {index + 1}
                      </td>

                      {/* Tên trạm */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {station.name}
                          </span>
                        </div>
                      </td>

                      {/* Tọa độ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation size={14} className="text-gray-400" />
                          <span className="font-mono text-gray-600 dark:text-gray-300">
                            {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                          </span>
                        </div>
                      </td>

                      {/* Thứ tự */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300">
                          {station.orderIndex}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          station.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {station.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
                          {station.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(station)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setStationToToggle(station)}
                            className={`p-2 rounded-lg text-gray-400 transition-colors ${
                              station.isActive
                                ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30'
                                : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/30'
                            }`}
                            title={station.isActive ? 'Tạm dừng hoạt động' : 'Kích hoạt lại'}
                          >
                            {station.isActive ? <CirclePause size={16} /> : <CirclePlay size={16} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {/* Trạng thái trống */}
              {!isLoading && filteredStations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <MapPin size={24} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="font-medium">Không tìm thấy trạm dừng nào.</p>
                      <p className="text-xs text-gray-400">
                        {searchTerm ? 'Thử tìm kiếm với từ khóa khác.' : 'Nhấn "Thêm trạm mới" để bắt đầu.'}
                      </p>
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
            showingCount={stations.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* Modal Thêm / Sửa trạm dừng */}
      <StationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStation(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedStation(null);
        }}
        initialData={selectedStation}
        onCreate={createStation}
        onUpdate={updateStation}
      />

      {/* Modal xác nhận chuyển đổi trạng thái */}
      <ConfirmModal
        isOpen={!!stationToToggle}
        onClose={() => setStationToToggle(null)}
        onConfirm={confirmToggle}
        title={stationToToggle?.isActive ? 'Xác nhận tạm dừng hoạt động' : 'Xác nhận kích hoạt'}
        description={stationToToggle?.isActive
          ? 'Bạn có chắc chắn muốn tạm dừng hoạt động trạm dừng này? Thứ tự các trạm trong tuyến sẽ được cập nhật lại tự động.'
          : 'Bạn có chắc chắn muốn kích hoạt lại trạm dừng này? Trạm sẽ được thêm vào cuối danh sách tuyến.'
        }
        confirmText={stationToToggle?.isActive ? 'Đồng ý tạm dừng' : 'Đồng ý kích hoạt'}
      />
    </PageWrapper>
  );
}
