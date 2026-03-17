import useSWR from 'swr';
import { tripService, TripQuery } from '@/services/tripService';
import toast from 'react-hot-toast';
import { useCallback, useState, useEffect } from 'react';

export const useTrips = (initialParams?: TripQuery) => {
  const [params, setParams] = useState<TripQuery>(initialParams || { page: 1, limit: 100 });

  useEffect(() => {
    if (initialParams) {
      setParams(prev => ({ ...prev, ...initialParams }));
    }
  }, [JSON.stringify(initialParams)]);

  // Check valid UUID format to avoid backend 400 errors
  const isValidUUID = (id: string | undefined) => {
    if (!id) return false;
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(id);
  };

  // Pause fetching if routeId is required but invalid
  const fetchKey = (params.routeId && !isValidUUID(params.routeId)) ? null : ['/trips', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => {
      // Remove invalid routeId before sending request
      const validParams = { ...params };
      if (!isValidUUID(validParams.routeId)) {
        delete validParams.routeId;
      }
      return tripService.getTrips(validParams);
    },
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách chuyến đi');
      },
      keepPreviousData: true,
    }
  );

  const updateFilters = useCallback((newParams: Partial<TripQuery>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  return {
    trips: data?.data?.data?.data || [],
    total: data?.data?.data?.meta?.total || 0,
    page: data?.data?.data?.meta?.page || 1,
    limit: data?.data?.data?.meta?.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    mutate,
  };
};
