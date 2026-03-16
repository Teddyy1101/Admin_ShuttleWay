import useSWR from 'swr';
import { routeService } from '@/services/routeService';
import { GetRoutesParams, Route } from '@/types/route';
import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';

// SWR Hook quản lý danh sách Routes
export const useRoutes = (initialParams?: GetRoutesParams) => {
  const [params, setParams] = useState<GetRoutesParams>(initialParams || { page: 1, limit: 10 });

  const fetchKey = ['/routes', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => routeService.getRoutes(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách tuyến đường');
      },
      keepPreviousData: true,
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetRoutesParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  return {
    routes: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    mutate,
  };
};

// SWR Hook quản lý chi tiết 1 Route
export const useRouteDetail = (id: string) => {
  const fetchKey = id ? `/routes/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => routeService.getRouteById(id),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải thông tin chi tiết tuyến đường');
      },
    }
  );

  return {
    route: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
};
