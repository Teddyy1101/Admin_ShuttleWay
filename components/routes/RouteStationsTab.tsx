'use client';

import { useState } from 'react';
import { Route } from '@/types/route';
import { MapPin, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { KeyedMutator } from 'swr';
import type { ApiResponse } from '@/types/api';

// Import bản đồ preview bằng dynamic để tránh lỗi SSR
const MapPreview = dynamic(() => import('@/components/routes/MapPreview'), { ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

// Import modal thêm trạm dừng
import AddStationModal from '@/components/stations/AddStationModal';

interface RouteStationsTabProps {
  route: Route;
  mutate: KeyedMutator<ApiResponse<Route>>; // Hàm SWR mutate để refresh data sau khi thêm trạm
}

export default function RouteStationsTab({ route, mutate }: RouteStationsTabProps) {
  const { theme } = useTheme();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const stations = route.stations?.sort((a, b) => a.orderIndex - b.orderIndex) || [];

  const center = useMemo(() => {
    if (stations.length > 0) {
      return { lat: stations[0].latitude, lng: stations[0].longitude };
    }
    return { lat: 10.762622, lng: 106.660172 }; // Mặc định: TP.HCM
  }, [stations]);

  return (
    <>
      {/* Header với nút Thêm trạm */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Danh sách trạm dừng ({stations.length} trạm)
        </h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-blue-600/20"
        >
          <Plus size={16} />
          Thêm trạm
        </button>
      </div>

      {/* Nội dung: Danh sách trạm + Bản đồ */}
      {stations.length === 0 ? (
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
          {/* Cột trái: Danh sách trạm (30%) */}
          <div className="w-full lg:w-[30%] bg-white dark:bg-gray-800/50 rounded-l p-6 border border-gray-100 dark:border-gray-800 order-2 lg:order-1 max-h-[500px] overflow-y-auto no-scrollbar">
            <div className="relative border-l-2 border-blue-500 dark:border-blue-600 ml-3 md:ml-4 space-y-8">
              {stations.map((station, index) => (
                <div key={station.id} className="relative pl-6 md:pl-8">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm" />

                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 mb-2 inline-block">
                      Trạm thứ {station.orderIndex}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">{station.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                      <span className="truncate">{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Bản đồ (70%) */}
          <div className="w-full lg:w-[70%] order-1 lg:order-2 rounded-l overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm h-[400px] lg:h-[500px] relative z-0">
            <MapPreview stations={stations} center={center} />
          </div>
        </div>
      )}

      {/* Modal Thêm trạm dừng */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        routeId={route.id}
        currentStationCount={stations.length}
        existingStationIds={stations.map((s) => s.id)}
        onSuccess={() => mutate()}
      />
    </>
  );
}
