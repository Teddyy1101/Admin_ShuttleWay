'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { busService } from '@/services/busService';
import { GetBusesParams, Bus, CreateBusPayload, UpdateBusPayload } from '@/types/bus';
import toast from 'react-hot-toast';

export const useBuses = (initialParams?: GetBusesParams) => {
  const [params, setParams] = useState<GetBusesParams>(initialParams || { page: 1, limit: 10 });

  const fetchKey = ['/buses', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => busService.getBuses(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách xe buýt');
      },
      keepPreviousData: true,
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetBusesParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  const createBus = async (payload: CreateBusPayload) => {
    try {
      await busService.createBus(payload);
      toast.success('Thêm xe buýt thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm xe buýt');
      throw error;
    }
  };

  const updateBus = async (id: string, payload: UpdateBusPayload) => {
    try {
      await busService.updateBus(id, payload);
      toast.success('Cập nhật thông tin xe thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin xe');
      throw error;
    }
  };

  const deleteBus = async (id: string) => {
    try {
      await busService.deleteBus(id);
      toast.success('Đã xóa xe buýt');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa xe buýt');
      throw error;
    }
  };

  const toggleStatus = async (bus: Bus) => {
    try {
      await busService.toggleBusStatus(bus.id);
      toast.success(bus.isActive ? 'Đã khóa xe buýt' : 'Đã mở khóa xe buýt');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thay đổi trạng thái');
      throw error;
    }
  };

  return {
    buses: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    createBus,
    updateBus,
    deleteBus,
    toggleStatus,
    mutate,
  };
};