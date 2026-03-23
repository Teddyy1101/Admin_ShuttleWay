import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import {
  SupportTicket,
  SupportTicketDetail,
  SupportTicketStatus,
  TicketReply,
  GetSupportTicketsParams,
} from '@/types/supportTicket';

export const supportTicketService = {
  // Lấy danh sách phiếu hỗ trợ có phân trang và lọc
  getSupportTickets: async (params?: GetSupportTicketsParams): Promise<ApiResponse<PaginatedData<SupportTicket>>> => {
    const response = await axiosClient.get('/support-tickets', { params });
    return response.data;
  },

  // Lấy chi tiết 1 phiếu hỗ trợ (bao gồm replies)
  getSupportTicketDetail: async (id: string): Promise<ApiResponse<SupportTicketDetail>> => {
    const response = await axiosClient.get(`/support-tickets/${id}`);
    return response.data;
  },

  // Cập nhật trạng thái phiếu hỗ trợ
  updateStatus: async (id: string, status: SupportTicketStatus): Promise<ApiResponse<SupportTicket>> => {
    const response = await axiosClient.patch(`/support-tickets/${id}/status`, { status });
    return response.data;
  },

  // Thêm câu trả lời (reply) vào phiếu hỗ trợ
  createReply: async (ticketId: string, content: string, senderId?: string): Promise<ApiResponse<TicketReply>> => {
    const response = await axiosClient.post(`/support-tickets/${ticketId}/replies`, { content, senderId });
    return response.data;
  },
};
