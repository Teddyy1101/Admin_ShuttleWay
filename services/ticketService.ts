import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Ticket, GetTicketsParams } from '@/types/ticket';

export const ticketService = {
  // Lấy danh sách vé có phân trang, lọc theo status, tìm kiếm...
  getTickets: async (params?: GetTicketsParams): Promise<ApiResponse<PaginatedData<Ticket>>> => {
    const response = await axiosClient.get('/tickets', { params });
    return response.data;
  },

  // Hủy vé
  cancelTicket: async (id: string): Promise<ApiResponse<Ticket>> => {
    const response = await axiosClient.patch(`/tickets/${id}/cancel`);
    return response.data;
  },
};
