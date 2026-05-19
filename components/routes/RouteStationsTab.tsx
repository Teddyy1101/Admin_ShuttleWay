'use client';

import { useState, useEffect, useMemo } from 'react';
import { Route, RouteStation, Station } from '@/types/route';
import { MapPin, Plus, GripVertical, Save, X, Loader2, ChevronDown, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import type { KeyedMutator } from 'swr';
import type { ApiResponse } from '@/types/api';

import { routeService } from '@/services/routeService';
import { stationService } from '@/services/stationService';

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
  const [isAddMode, setIsAddMode] = useState(false);
  const [localStations, setLocalStations] = useState<RouteStation[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Danh sách trạm có sẵn (Master Data) để chọn thêm vào tuyến
  const [availableStations, setAvailableStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState('');

  // Sort theo orderIndex
  const originalStations = useMemo(() => {
    return [...(route.routeStations || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [route.routeStations]);

  useEffect(() => {
    setLocalStations(originalStations);
  }, [originalStations]);

  // Kiểm tra xem người dùng đã kéo thả thay đổi thứ tự chưa
  const hasOrderChanged = useMemo(() => {
    const originalIds = originalStations.map(rs => rs.station?.id).join(',');
    const localIds = localStations.map(rs => rs.station?.id).join(',');
    return originalIds !== localIds;
  }, [originalStations, localStations]);

  // Tính toán Center cho Map
  const center = useMemo(() => {
    if (originalStations.length > 0) {
      const firstStation = originalStations[0]?.station;
      if (firstStation) {
        return { lat: firstStation.latitude, lng: firstStation.longitude };
      }
    }
    return { lat: 10.762622, lng: 106.660172 };
  }, [originalStations]);

  // Map dữ liệu trạm cho MapPreview (cần dạng { id, name, latitude, longitude })
  const stationsForMap = useMemo(() => {
    return localStations.map(rs => ({
      id: rs.station?.id,
      name: rs.station?.name,
      latitude: rs.station?.latitude,
      longitude: rs.station?.longitude,
    }));
  }, [localStations]);

  // Tải danh sách trạm Master Data khi mở chế độ thêm trạm
  const fetchAvailableStations = async () => {
    setIsLoadingStations(true);
    try {
      const res = await stationService.getStations({ limit: 200, isActive: true });
      setAvailableStations(res.data?.data || []);
    } catch {
      setAvailableStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Mở chế độ thêm trạm
  const handleOpenAddMode = () => {
    setIsAddMode(true);
    fetchAvailableStations();
  };

  // Danh sách trạm chưa được chọn (lọc bỏ những trạm đã có trong tuyến)
  const unselectedStations = useMemo(() => {
    const existingIds = localStations.map(rs => rs.station?.id);
    return availableStations.filter(s => !existingIds.includes(s.id));
  }, [availableStations, localStations]);

  // Thêm trạm vào tuyến
  const handleAddStation = () => {
    if (!selectedStationId) return;
    const station = availableStations.find(s => s.id === selectedStationId);
    if (!station) return;

    // Kiểm tra trùng lặp
    if (localStations.some(rs => rs.station?.id === station.id)) {
      toast.error('Trạm này đã có trong tuyến rồi!');
      return;
    }

    const newRouteStation: RouteStation = {
      orderIndex: localStations.length + 1,
      station,
    };

    setLocalStations(prev => [...prev, newRouteStation]);
    setSelectedStationId('');
  };

  // Xóa trạm khỏi tuyến
  const handleRemoveStation = (stationId: string) => {
    setLocalStations(prev => prev.filter(rs => rs.station?.id !== stationId));
  };

  // Hàm Hủy kéo thả
  const handleCancelReorder = () => {
    setLocalStations(originalStations);
    setIsAddMode(false);
    setSelectedStationId('');
  };

  // Hàm Lưu thứ tự mới — gọi updateRoute với mảng stations
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const stationsPayload = localStations
        .filter((rs) => rs.station?.id) // Loại bỏ station thiếu ID
        .map((rs, index) => ({
          stationId: rs.station!.id,
          orderIndex: index + 1,
        }));

      if (stationsPayload.length === 0) {
        toast.error('Không có trạm hợp lệ để lưu!');
        setIsSavingOrder(false);
        return;
      }

      if (stationsPayload.length !== localStations.length) {
        toast.error('Một số trạm bị thiếu dữ liệu, vui lòng tải lại trang!');
        setIsSavingOrder(false);
        return;
      }

      await routeService.updateRoute(route.routeCode, {
        stations: stationsPayload,
      });

      toast.success('Đã lưu danh sách trạm thành công!');
      setIsAddMode(false);
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi lưu, vui lòng thử lại!');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Kiểm tra có thay đổi nào (kéo thả hoặc thêm/xóa trạm)
  const hasChanges = useMemo(() => {
    if (localStations.length !== originalStations.length) return true;
    return hasOrderChanged;
  }, [localStations, originalStations, hasOrderChanged]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Danh sách trạm dừng 
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-md text-sm">
            {localStations.length} trạm
          </span>
        </h3>
        
        <div className="flex items-center gap-3">
          {/* Nút Hủy và Lưu (Chỉ hiện khi có sự thay đổi) */}
          {hasChanges && (
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

          {/* Nút Thêm trạm (Ẩn đi nếu đang chỉnh sửa thứ tự) */}
          {!hasChanges && (
            <button
              onClick={handleOpenAddMode}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20"
            >
              <Plus size={16} />
              Thêm trạm
            </button>
          )}
        </div>
      </div>

      {/* Dropdown chọn trạm để thêm vào tuyến */}
      {isAddMode && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">Chọn trạm để thêm vào tuyến:</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                disabled={isLoadingStations}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-60 cursor-pointer pr-10"
              >
                <option value="">
                  {isLoadingStations
                    ? 'Đang tải...'
                    : `-- Chọn trạm (${unselectedStations.length} khả dụng) --`
                  }
                </option>
                {unselectedStations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={handleAddStation}
              disabled={!selectedStationId}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20 shrink-0"
            >
              <Plus size={16} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* Nội dung */}
      {localStations.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Không có trạm dừng nào được cấu hình cho tuyến đường này.</p>
          <button
            onClick={handleOpenAddMode}
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
                {localStations.map((rs, index) => (
                  <Reorder.Item 
                    key={rs.station?.id || index} 
                    value={rs} 
                    className="relative pl-6 md:pl-8 mb-6 group cursor-grab active:cursor-grabbing"
                  >
                    {/* Nút nắm để kéo (Drag Handle) */}
                    <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical size={18} />
                    </div>

                    {/* Timeline dot */}
                    <div className="absolute -left-[11px] top-1.5 h-5 w-5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm transition-transform group-active:scale-125" />

                    <div className="bg-white dark:bg-gray-800/80 p-3 rounded-l dark:border-gray-700 transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded mb-2 inline-block transition-colors ${
                            rs.orderIndex !== index + 1 
                              ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
                              : 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
                          }`}>
                            Trạm thứ {index + 1}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 select-none">{rs.station?.name}</h4>
                        </div>
                        {/* Nút xóa trạm khỏi tuyến */}
                        {(isAddMode || hasChanges) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveStation(rs.station?.id || ''); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors shrink-0"
                            title="Bỏ trạm khỏi tuyến"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>

          {/* Cột phải: Bản đồ (Sử dụng MapPreview) */}
          <div className="w-full lg:w-[65%] order-1 lg:order-2 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm h-[400px] lg:h-[500px] relative z-0 bg-gray-100 dark:bg-gray-900">
            <MapPreview stations={stationsForMap} center={center} />
          </div>
        </div>
      )}
    </>
  );
}