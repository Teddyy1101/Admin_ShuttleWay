// Trạng thái phiếu hỗ trợ
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

// Danh mục phiếu hỗ trợ
export type TicketCategory =
  | 'LOST_ITEM'
  | 'COMPLAINT'
  | 'PAYMENT_ISSUE'
  | 'GENERAL_INQUIRY'
  | 'LANDING_PAGE_CONTACT';

// Thông tin người gửi reply
export interface TicketReplySender {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

// Một reply trong phiếu hỗ trợ
export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string | null;
  content: string;
  createdAt: string;
  sender: TicketReplySender | null;
}

// Thông tin user liên kết (nếu gửi từ App)
export interface SupportTicketUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

// Phiếu hỗ trợ (danh sách)
export interface SupportTicket {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  category: TicketCategory;
  title: string;
  content: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  user: SupportTicketUser | null;
}

// Phiếu hỗ trợ chi tiết (bao gồm replies)
export interface SupportTicketDetail extends SupportTicket {
  replies: TicketReply[];
}

// Tham số lọc danh sách phiếu hỗ trợ
export interface GetSupportTicketsParams {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  category?: TicketCategory;
}
