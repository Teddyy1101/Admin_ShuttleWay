export type TicketType = 'MONTHLY' | 'SINGLE_TRIP';
export type TicketStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// Thông tin trạm dừng rút gọn (dùng cho vé)
export interface TicketStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Ticket {
  id: string;
  student: { fullName: string; id: string; phone?: string; avatarUrl?: string };
  parent?: { fullName: string; id: string; phone?: string };
  route: { name: string; id: string };
  pickUpStation?: TicketStation | null;
  dropOffStation?: TicketStation | null;
  ticketType: TicketType;
  priceAtBuy: number;
  validFrom: string;
  validUntil: string;
  status: TicketStatus;
  isActive: boolean;
  createdAt: string;
}

export interface GetTicketsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TicketStatus;
  ticketType?: TicketType;
  routeId?: string;
}