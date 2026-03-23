'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { leaveRequestService } from '@/services/leaveRequestService';
import { GetLeaveRequestsParams, LeaveStatus } from '@/types/leaveRequest';
import toast from 'react-hot-toast';

export const useLeaveRequests = (initialParams?: GetLeaveRequestsParams) => {
  const [params, setParams] = useState<GetLeaveRequestsParams>(initialParams || { page: 1, limit: 10 });

  // Tạo key fetch cho SWR để tự động gọi lại API khi params thay đổi
  const fetchKey = ['/admin/leave-requests', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => leaveRequestService.getLeaveRequests(params),
    {
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách đơn xin nghỉ');
      },
      keepPreviousData: true, // Giữ data cũ trong lúc chờ data mới để tránh giật UI
    }
  );

  // Hàm cập nhật bộ lọc (tự động đưa về trang 1 khi filter thay đổi)
  const updateFilters = useCallback((newParams: Partial<GetLeaveRequestsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  // Hàm thay đổi trang
  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Duyệt đơn xin nghỉ
  const approveRequest = async (id: string) => {
    try {
      await leaveRequestService.updateStatus(id, 'APPROVED');
      toast.success('Đã duyệt đơn xin nghỉ thành công');
      mutate(); // Reload lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt đơn xin nghỉ');
      throw error;
    }
  };

  // Từ chối đơn xin nghỉ
  const rejectRequest = async (id: string) => {
    try {
      await leaveRequestService.updateStatus(id, 'REJECTED');
      toast.success('Đã từ chối đơn xin nghỉ');
      mutate(); // Reload lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối đơn xin nghỉ');
      throw error;
    }
  };

  return {
    leaveRequests: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: params.page || 1,
    limit: params.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    approveRequest,
    rejectRequest,
    mutate,
  };
};
