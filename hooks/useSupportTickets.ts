'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { supportTicketService } from '@/services/supportTicketService';
import { GetSupportTicketsParams, SupportTicketStatus } from '@/types/supportTicket';
import toast from 'react-hot-toast';

export const useSupportTickets = (initialParams?: GetSupportTicketsParams) => {
  const [params, setParams] = useState<GetSupportTicketsParams>(initialParams || { page: 1, limit: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ======== Fetch danh sách phiếu hỗ trợ ========
  const listKey = ['/admin/support-tickets', JSON.stringify(params)];

  const { data: listData, error: listError, isLoading: isListLoading, mutate: mutateList } = useSWR(
    listKey,
    () => supportTicketService.getSupportTickets(params),
    {
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách phiếu hỗ trợ');
      },
      keepPreviousData: true,
    }
  );

  // ======== Fetch chi tiết phiếu hỗ trợ (khi chọn 1 phiếu) ========
  const detailKey = selectedId ? ['/admin/support-tickets/detail', selectedId] : null;

  const { data: detailData, isLoading: isDetailLoading, mutate: mutateDetail } = useSWR(
    detailKey,
    () => supportTicketService.getSupportTicketDetail(selectedId!),
    {
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải chi tiết phiếu hỗ trợ');
      },
    }
  );

  // Cập nhật bộ lọc (tự động reset về trang 1)
  const updateFilters = useCallback((newParams: Partial<GetSupportTicketsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  // Thay đổi trang
  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // Chọn 1 phiếu để xem chi tiết
  const selectTicket = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Cập nhật trạng thái phiếu hỗ trợ
  const updateTicketStatus = async (id: string, status: SupportTicketStatus) => {
    try {
      await supportTicketService.updateStatus(id, status);
      const statusLabels: Record<SupportTicketStatus, string> = {
        OPEN: 'Mở',
        IN_PROGRESS: 'Đang xử lý',
        CLOSED: 'Đã đóng',
      };
      toast.success(`Đã chuyển trạng thái thành "${statusLabels[status]}"`);
      mutateList();
      mutateDetail();
    } catch (error: Error & { response?: { data?: { message?: string } } } | any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
      throw error;
    }
  };

  // Gửi phản hồi (reply) vào phiếu hỗ trợ
  const sendReply = async (ticketId: string, content: string, senderId?: string) => {
    try {
      await supportTicketService.createReply(ticketId, content, senderId);
      toast.success('Đã gửi phản hồi thành công');
      mutateDetail();
    } catch (error: Error & { response?: { data?: { message?: string } } } | any) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi phản hồi');
      throw error;
    }
  };

  return {
    // Danh sách
    tickets: listData?.data?.data || [],
    total: listData?.data?.meta?.total || 0,
    page: params.page || 1,
    limit: params.limit || 20,
    isListLoading,
    isListError: !!listError,
    params,
    updateFilters,
    changePage,

    // Chi tiết
    selectedTicket: detailData?.data || null,
    isDetailLoading,
    selectedId,
    selectTicket,

    // Hành động
    updateTicketStatus,
    sendReply,
    mutateList,
    mutateDetail,
  };
};
