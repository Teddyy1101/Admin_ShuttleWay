import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Receipt, User, Bus, Phone, CalendarRange, 
  FileText, CheckCircle2, CreditCard, Smartphone, Banknote, Building2 
} from 'lucide-react';
import { AdminNotification } from '@/types/dashboard';
import { PaymentMethod, TransactionStatus } from '@/types/transaction';
import { LeaveStatus } from '@/types/leaveRequest';
import { useRouter } from 'next/navigation';

interface Props {
  notification: AdminNotification | null;
  onClose: () => void;
}

// --- Helpers cho Transaction ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

const paymentMethodConfig: Record<string, { label: string; color: string; icon: any }> = {
  VNPAY: { label: 'VNPAY', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CreditCard },
  MOMO: { label: 'MOMO', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Smartphone },
  SEPAY: { label: 'SEPAY', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Building2 },
  CASH: { label: 'Tiền mặt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Banknote },
};

const PaymentBadge = ({ method }: { method: string }) => {
  const config = paymentMethodConfig[method] || paymentMethodConfig.CASH;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const TransactionStatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, any> = {
    SUCCESS: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Thành công' },
    PENDING: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Chờ xử lý' },
    FAILED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Thất bại' },
  };
  const config = configs[status] || configs.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'SUCCESS' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {config.label}
    </span>
  );
};

// --- Helpers cho Leave Request ---
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calcDays = (from: string, to: string) => {
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
  return Math.max(1, Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const leaveStatusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
};

const LeaveStatusBadge = ({ status }: { status: string }) => {
  const config = leaveStatusConfig[status] || leaveStatusConfig.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

const getStudentRoutes = (req: any) => {
  const tickets = req.student?.studentTickets || [];
  const uniqueRoutes = tickets
    .map((t: any) => t.route?.name)
    .filter((name: string, idx: number, arr: string[]) => name && arr.indexOf(name) === idx);
  return uniqueRoutes.length > 0 ? uniqueRoutes.join(', ') : '—';
};

export default function NotificationDetailModal({ notification, onClose }: Props) {
  const router = useRouter();

  if (!notification || !notification.payload) return null;

  const handleActionClick = () => {
    onClose();
    if (notification.type === 'PAYMENT_SUCCESS') {
      router.push('/transactions');
    } else {
      router.push('/requests/absence');
    }
  };

  const isTransaction = notification.type === 'PAYMENT_SUCCESS';
  const detailTransaction = isTransaction ? notification.payload : null;
  const detailRequest = !isTransaction ? notification.payload : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-[101]"
        >
          {isTransaction && detailTransaction && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Receipt size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết hóa đơn</h3>
                    <p className="text-xs text-gray-500 font-mono">{detailTransaction.transactionCode}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Người thanh toán</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.user?.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Nội dung</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.ticket?.ticketType === 'MONTHLY' ? 'Vé tháng' : 'Vé lượt'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tuyến xe</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.ticket?.route?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phương thức</span>
                    <PaymentBadge method={detailTransaction.paymentMethod} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <TransactionStatusBadge status={detailTransaction.status} />
                  </div>
                  {detailTransaction.promotion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Mã khuyến mãi</span>
                      <span className="font-mono text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md">{detailTransaction.promotion.code}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Thời gian tạo</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDateTime(detailTransaction.createdAt)}</span>
                  </div>
                </div>

                {/* Bảng tiền */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Giá gốc</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(detailTransaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Giảm giá</span>
                    <span className="font-medium text-red-500">-{formatCurrency(detailTransaction.discountAmount || 0)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Thực thu</span>
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(detailTransaction.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors">
                  Đóng
                </button>
                <button onClick={handleActionClick} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-emerald-600/20">
                  Đến trang Quản lý
                </button>
              </div>
            </>
          )}

          {!isTransaction && detailRequest && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết đơn xin nghỉ</h3>
                    <p className="text-xs text-gray-500 font-mono">{detailRequest.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><User size={14} />Học sinh</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailRequest.student?.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Bus size={14} />Tuyến xe</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{getStudentRoutes(detailRequest)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><User size={14} />Phụ huynh</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailRequest.parent?.fullName}</span>
                  </div>
                  {detailRequest.parent?.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Phone size={14} />Số điện thoại</span>
                      <a href={`tel:${detailRequest.parent.phone}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{detailRequest.parent.phone}</a>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <LeaveStatusBadge status={detailRequest.status} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ngày gửi đơn</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDateTime(detailRequest.createdAt)}</span>
                  </div>
                </div>

                {/* Thời gian nghỉ */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarRange size={15} className="text-blue-500" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Thời gian nghỉ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Từ ngày</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(detailRequest.fromDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Đến ngày</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(detailRequest.toDate)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Tổng thời gian</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{calcDays(detailRequest.fromDate, detailRequest.toDate)} ngày</span>
                  </div>
                </div>

                {/* Lý do */}
                {detailRequest.reason && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Lý do nghỉ</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{detailRequest.reason}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors">
                  Đóng
                </button>
                <button onClick={handleActionClick} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-600/20">
                  Xử lý đơn
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
