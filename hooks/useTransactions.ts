'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { transactionService } from '@/services/transactionService';
import { GetTransactionsParams } from '@/types/transaction';
import toast from 'react-hot-toast';

export const useTransactions = (initialParams?: GetTransactionsParams) => {
  const [params, setParams] = useState<GetTransactionsParams>(initialParams || { page: 1, limit: 10 });

  // Tạo key fetch cho SWR để tự động gọi lại API khi params thay đổi
  const fetchKey = ['/admin/transactions', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => transactionService.getTransactions(params),
    {
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách giao dịch');
      },
      keepPreviousData: true, // Giữ data cũ trong lúc chờ data mới để tránh giật UI
    }
  );

  // Fetch thống kê dòng tiền
  const { data: statsData, isLoading: isStatsLoading } = useSWR(
    '/admin/transactions/stats',
    () => transactionService.getStats(),
    {
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải thống kê giao dịch');
      },
    }
  );

  // Hàm cập nhật bộ lọc (tự động đưa về trang 1 khi filter thay đổi)
  const updateFilters = useCallback((newParams: Partial<GetTransactionsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  // Hàm thay đổi trang
  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Hàm xác nhận thanh toán
  const confirmPayment = async (id: string) => {
    try {
      await transactionService.confirmPayment(id);
      toast.success('Xác nhận thanh toán thành công');
      mutate(); // Reload lại danh sách sau khi cập nhật
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
      throw error;
    }
  };

  return {
    transactions: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: params.page || 1,
    limit: params.limit || 10,
    isLoading,
    isError: !!error,
    params,
    stats: statsData?.data || null,
    isStatsLoading,
    updateFilters,
    changePage,
    confirmPayment,
    mutate,
  };
};
