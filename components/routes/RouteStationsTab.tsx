'use client';

import { useState, useEffect, useMemo } from 'react';
import { Route, Station } from '@/types/route';
import { MapPin, Plus, GripVertical, Save, X, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import type { KeyedMutator } from 'swr';
import type { ApiResponse } from '@/types/api';

// Đừng quên import stationService để gọi API update ngầm
import { stationService } from '@/services/stationService';
import AddStationModal from '@/components/stations/AddStationModal';

const MapPreview = dynamic(() => import('@/components/routes/MapPreview'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

interface RouteStationsTabProps {
  route: Route;
  mutate: KeyedMutator<ApiResponse<Route>>; 
}

export default function RouteStationsTab({ route, mutate }: RouteStationsTabProps) {
  const { theme } = useTheme();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // State quản lý danh sách trạm phục vụ cho kéo thả
  const [localStations, setLocalStations] = useState<Station[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Khởi tạo và đồng bộ data gốc (Sắp xếp theo orderIndex)
  const originalStations = useMemo(() => {
    return [...(route.stations || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [route.stations]);

  // Sync state tạm khi data gốc thay đổi
  useEffect(() => {
    setLocalStations(originalStations);
  }, [originalStations]);

  // Kiểm tra xem người dùng đã kéo thả thay đổi thứ tự chưa (So sánh chuỗi ID)
  const hasOrderChanged = useMemo(() => {
    const originalIds = originalStations.map(s => s.id).join(',');
    const localIds = localStations.map(s => s.id).join(',');
    return originalIds !== localIds;
  }, [originalStations, localStations]);

  // Tính toán Center cho Map
  const center = useMemo(() => {
    if (originalStations.length > 0) {
      return { lat: originalStations[0].latitude, lng: originalStations[0].longitude };
    }
    return { lat: 10.762622, lng: 106.660172 };
  }, [originalStations]);

  // Hàm Hủy kéo thả
  const handleCancelReorder = () => {
    setLocalStations(originalStations); // Reset về như cũ
  };

  // Hàm Lưu thứ tự mới
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Tìm ra những trạm bị thay đổi vị trí so với orderIndex cũ
      const updatePromises = localStations.map((station, index) => {
        const newOrderIndex = index + 1; // Index mới (bắt đầu từ 1)
        if (station.orderIndex !== newOrderIndex) {
          // Gọi trực tiếp stationService để không bị trigger toast loạn ngầu của hook
          return stationService.updateStation(station.id, { orderIndex: newOrderIndex });
        }
        return null;
      }).filter(Boolean); // Lọc bỏ các null

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        toast.success('Đã lưu thứ tự trạm thành công!');
        mutate(); // F5 lại data tuyến đường
      }
    } catch (error) {
      toast.error('Lỗi khi lưu thứ tự, vui lòng thử lại!');
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Danh sách trạm dừng 
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-md text-sm">
            {originalStations.length} trạm
          </span>
        </h3>
        
        <div className="flex items-center gap-3">
          {/* Nút Hủy và Lưu (Chỉ hiện khi có sự thay đổi thứ tự) */}
          {hasOrderChanged && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <button
                onClick={handleCancelReorder}
                disabled={isSavingOrder}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors text-sm"
              >
                <X size={16} />
                Hủy
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-green-600/20 disabled:opacity-70"
              >
                {isSavingOrder ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu thứ tự
              </button>
            </div>
          )}

          {/* Nút Thêm trạm (Ẩn đi nếu đang chỉnh sửa thứ tự cho đỡ rối) */}
          {!hasOrderChanged && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20"
            >
              <Plus size={16} />
              Thêm trạm
            </button>
          )}
        </div>
      </div>

      {/* Nội dung */}
      {originalStations.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Không có trạm dừng nào được cấu hình cho tuyến đường này.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Thêm trạm đầu tiên
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cột trái: Danh sách trạm (Dùng Reorder của Framer Motion) */}
          <div className="w-full lg:w-[35%] bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 order-2 lg:order-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            
            <p className="text-xs text-gray-500 mb-6 italic flex items-center gap-1">
              <GripVertical size={14} /> Kéo thả các thẻ để thay đổi thứ tự trạm
            </p>

            <div className="relative border-l-2 border-blue-500 dark:border-blue-600 ml-3 md:ml-4 pt-2">
              <Reorder.Group axis="y" values={localStations} onReorder={setLocalStations}>
                {localStations.map((station, index) => (
                  <Reorder.Item 
                    key={station.id} 
                    value={station} 
                    className="relative pl-6 md:pl-8 mb-6 group cursor-grab active:cursor-grabbing"
                  >
                    {/* Nút nắm để kéo (Drag Handle) */}
                    <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical size={18} />
                    </div>

                    {/* Timeline dot */}
                    <div className="absolute -left-[11px] top-1.5 h-5 w-5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm transition-transform group-active:scale-125" />

                    <div className="bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow hover:shadow-md">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded mb-2 inline-block transition-colors ${
                        station.orderIndex !== index + 1 
                          ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' // Đổi màu nếu bị xê dịch
                          : 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
                      }`}>
                        Trạm thứ {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 select-none">{station.name}</h4>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>

          {/* Cột phải: Bản đồ (Sử dụng MapPreview) */}
          <div className="w-full lg:w-[65%] order-1 lg:order-2 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm h-[400px] lg:h-[500px] relative z-0 bg-gray-100 dark:bg-gray-900">
            <MapPreview stations={localStations} center={center} />
          </div>
        </div>
      )}

      {/* Modal Thêm trạm dừng */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        routeId={route.id}
        currentStationCount={originalStations.length}
        existingStationIds={originalStations.map((s) => s.id)}
        onSuccess={() => mutate()}
      />
    </>
  );
}