import useSWR from 'swr';
import { tripService } from '@/services/tripService';
import { GetTripsParams } from '@/types/trip';
import toast from 'react-hot-toast';
import { useCallback, useState, useEffect } from 'react';

// SWR Hook quản lý danh sách chuyến đi
export const useTrips = (initialParams?: GetTripsParams) => {
  const [params, setParams] = useState<GetTripsParams>(initialParams || { page: 1, limit: 20 });

  // Khi initialParams thay đổi, thay thế hoàn toàn (không merge) để xóa lọc hoạt động đúng
  useEffect(() => {
    if (initialParams) {
      setParams({ ...initialParams });
    }
  }, [JSON.stringify(initialParams)]);

  const fetchKey = ['/trips', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => tripService.getTrips(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách chuyến đi');
      },
      keepPreviousData: true,
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetTripsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  return {
    trips: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 20,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    mutate,
  };
};
