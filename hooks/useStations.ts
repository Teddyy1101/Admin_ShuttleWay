import useSWR from 'swr';
import { stationService } from '@/services/stationService';
import { CreateStationPayload, GetStationsParams, Station, UpdateStationPayload } from '@/types/route';
import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';

// SWR Hook quản lý danh sách Stations
export const useStations = (initialParams?: GetStationsParams) => {
  const [params, setParams] = useState<GetStationsParams>(initialParams || { page: 1, limit: 10 });

  // fetch key: stringify params để SWR cache chính xác khi query thay đổi
  const fetchKey = ['/stations', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => stationService.getStations(params),
    {
      onError: (err: { response?: { data?: { message?: string } } }) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách trạm dừng');
      },
      keepPreviousData: true,
    }
  );

  // Cập nhật bộ lọc (reset về trang 1 khi đổi filter)
  const updateFilters = useCallback((newParams: Partial<GetStationsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  // Chuyển trang
  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Tạo trạm dừng mới
  const createStation = async (payload: CreateStationPayload) => {
    try {
      await stationService.createStation(payload);
      toast.success('Thêm trạm dừng thành công!');
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi thêm trạm dừng');
      throw error;
    }
  };

  // Cập nhật trạm dừng
  const updateStation = async (id: string, payload: UpdateStationPayload) => {
    try {
      await stationService.updateStation(id, payload);
      toast.success('Cập nhật trạm dừng thành công!');
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạm dừng');
      throw error;
    }
  };

  // Bật/Tắt trạng thái hoạt động trạm dừng (khi tắt sẽ gỡ khỏi tuyến đường)
  const toggleStationStatus = async (station: Station) => {
    try {
      await stationService.toggleStationStatus(station.id);
      if (station.isActive) {
        toast.success('Đã tạm dừng trạm dừng. Trạm đã được gỡ khỏi tất cả tuyến đường liên quan.', { duration: 5000 });
      } else {
        toast.success('Đã kích hoạt trạm dừng!');
      }
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái trạm dừng');
    }
  };

  // Tạm dừng hoạt động trạm dừng (xóa mềm)
  const deleteStation = async (id: string) => {
    try {
      await stationService.deleteStation(id);
      toast.success('Đã tạm dừng hoạt động trạm dừng!');
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi tạm dừng hoạt động trạm dừng');
    }
  };

  return {
    stations: (data?.data?.data || []) as Station[],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 10,
    totalPages: data?.data?.meta?.totalPages || 1,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    createStation,
    updateStation,
    toggleStationStatus,
    deleteStation,
    mutate,
  };
};
