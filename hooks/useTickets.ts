'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { ticketService } from '@/services/ticketService';
import { GetTicketsParams } from '@/types/ticket';
import toast from 'react-hot-toast';

export const useTickets = (initialParams?: GetTicketsParams) => {
  const [params, setParams] = useState<GetTicketsParams>(initialParams || { page: 1, limit: 10 });

  // Tạo key fetch cho SWR để tự động gọi lại API khi params thay đổi
  const fetchKey = ['/admin/tickets', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => ticketService.getTickets(params),
    {
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách vé');
      },
      keepPreviousData: true, // Giữ data cũ trong lúc chờ data mới để tránh giật UI
    }
  );

  // Hàm cập nhật bộ lọc (tự động đưa về trang 1 khi filter thay đổi)
  const updateFilters = useCallback((newParams: Partial<GetTicketsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  // Hàm thay đổi trang
  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Hàm xử lý hủy vé
  const cancelTicket = async (id: string) => {
    try {
      await ticketService.cancelTicket(id);
      toast.success('Hủy vé thành công');
      mutate(); // Reload lại danh sách sau khi hủy
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy vé');
      throw error;
    }
  };

  return {
    tickets: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: params.page || 1,
    limit: params.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    cancelTicket,
    mutate,
  };
};
