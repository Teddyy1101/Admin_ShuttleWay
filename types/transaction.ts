// Kiểu trạng thái giao dịch
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

// Kiểu phương thức thanh toán
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'SEPAY' | 'CASH';

// Interface giao dịch
export interface Transaction {
  id: string;
  transactionCode: string;
  ticketId: string;
  parentId: string | null;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ticket: {
    id: string;
    ticketType: 'MONTHLY' | 'SINGLE_TRIP';
    priceAtBuy: number;
    student: { id: string; fullName: string };
    route: { id: string; name: string };
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  promotion: {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null;
}

// Tham số truy vấn danh sách giao dịch
export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

// Thống kê dòng tiền
export interface TransactionStats {
  totalRevenue: number;
  pendingAmount: number;
  byPaymentMethod: Record<string, number>;
}
