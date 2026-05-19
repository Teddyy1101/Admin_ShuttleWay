'use client';

import { useState, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Filter,
  FilterX,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  CalendarRange,
  Receipt,
  Loader2,
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { transactionService } from '@/services/transactionService';
import { Transaction, TransactionStatus, PaymentMethod } from '@/types/transaction';
import toast from 'react-hot-toast';

// Định dạng tiền VNĐ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Định dạng ngày giờ hiển thị
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

// Cấu hình badge phương thức thanh toán
const paymentMethodConfig: Record<PaymentMethod, { label: string; color: string; icon: typeof CreditCard }> = {
  VNPAY: { label: 'VNPAY', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CreditCard },
  MOMO: { label: 'MOMO', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Smartphone },
  SEPAY: { label: 'SEPAY', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Building2 },
  CASH: { label: 'Tiền mặt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Banknote },
};

// Badge phương thức thanh toán
const PaymentBadge = ({ method }: { method: PaymentMethod }) => {
  const config = paymentMethodConfig[method];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// Badge trạng thái
const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  const configs = {
    SUCCESS: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Thành công' },
    PENDING: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Chờ xử lý' },
    FAILED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Thất bại' },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'SUCCESS' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
        }`} />
      {config.label}
    </span>
  );
};

export default function TransactionsPage() {
  const {
    transactions, total, page, limit, isLoading, params,
    stats, isStatsLoading,
    updateFilters, changePage, confirmPayment,
  } = useTransactions({ page: 1, limit: 10 });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Xuất báo cáo Excel — lấy TẤT CẢ dữ liệu theo bộ lọc hiện tại
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch tất cả giao dịch theo bộ lọc hiện tại (không giới hạn trang)
      const { status, paymentMethod, search, fromDate, toDate } = params;
      const exportRes = await transactionService.exportTransactions({ status, paymentMethod, search, fromDate, toDate });
      const allTransactions: Transaction[] = exportRes?.data?.data || [];

      if (allTransactions.length === 0) {
        toast.error('Không có giao dịch nào để xuất báo cáo');
        return;
      }

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lịch sử giao dịch');

      const headers = ['STT', 'Mã giao dịch', 'Thời gian', 'Người thanh toán', 'SĐT', 'Nội dung', 'Phương thức', 'Giá gốc', 'Giảm giá', 'Thực thu', 'Trạng thái'];
      const colCount = headers.length;

      const colWidths = [8, 24, 20, 25, 16, 35, 16, 18, 18, 18, 16];
      worksheet.columns = colWidths.map((w) => ({ width: w }));

      const thinBorder = {
        top: { style: 'thin' as const, color: { argb: '000000' } },
        left: { style: 'thin' as const, color: { argb: '000000' } },
        bottom: { style: 'thin' as const, color: { argb: '000000' } },
        right: { style: 'thin' as const, color: { argb: '000000' } },
      };

      // ===== Dòng 1: Tiêu đề gộp cột =====
      const titleRow = worksheet.addRow(['BÁO CÁO LỊCH SỬ GIAO DỊCH']);
      worksheet.mergeCells(1, 1, 1, colCount);
      const titleCell = titleRow.getCell(1);
      titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 30;

      // ===== Dòng 2: Thông tin bộ lọc =====
      const statusLabels: Record<string, string> = { SUCCESS: 'Thành công', PENDING: 'Chờ xử lý', FAILED: 'Thất bại' };
      const filterParts: string[] = [];
      if (status) filterParts.push(`Trạng thái: ${statusLabels[status] || status}`);
      if (paymentMethod) filterParts.push(`Phương thức: ${paymentMethodConfig[paymentMethod].label}`);
      if (fromDate) filterParts.push(`Từ ngày: ${fromDate}`);
      if (toDate) filterParts.push(`Đến ngày: ${toDate}`);
      if (search) filterParts.push(`Tìm kiếm: "${search}"`);

      const filterText = filterParts.length > 0 ? `Bộ lọc: ${filterParts.join(' | ')}` : `Tất cả giao dịch — Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
      const filterRow = worksheet.addRow([filterText]);
      worksheet.mergeCells(2, 1, 2, colCount);
      filterRow.getCell(1).font = { name: 'Times New Roman', size: 11, italic: true };
      filterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // ===== Dòng 3: Trống =====
      worksheet.addRow([]);

      // ===== Dòng 4: Tiêu đề bảng =====
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', size: 12, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });
      headerRow.height = 24;

      // ===== Dòng 5+: Dữ liệu =====
      const statusMap: Record<string, string> = { SUCCESS: 'Thành công', PENDING: 'Chờ xử lý', FAILED: 'Thất bại' };
      let sumTotal = 0, sumDiscount = 0, sumFinal = 0;

      allTransactions.forEach((t: Transaction, index: number) => {
        sumTotal += t.totalAmount;
        sumDiscount += t.discountAmount;
        sumFinal += t.finalAmount;

        const row = worksheet.addRow([
          index + 1,
          t.transactionCode,
          formatDateTime(t.createdAt),
          t.user.fullName,
          t.user.phone || '—',
          `${t.ticket.ticketType === 'MONTHLY' ? 'Vé tháng' : 'Vé lượt'} - ${t.ticket.route.name}`,
          paymentMethodConfig[t.paymentMethod].label,
          t.totalAmount,
          t.discountAmount,
          t.finalAmount,
          statusMap[t.status] || t.status,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Times New Roman', size: 12 };
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle', wrapText: true };
          if (colNumber >= 8 && colNumber <= 10) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });
      });

      // ===== Dòng tổng kết =====
      const summaryRow = worksheet.addRow([
        '', '', '', '', '', '', 'TỔNG CỘNG',
        sumTotal, sumDiscount, sumFinal, '',
      ]);
      summaryRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Times New Roman', size: 12, bold: true };
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle' };
        if (colNumber >= 8 && colNumber <= 10) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (colNumber === 7) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
      summaryRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
      summaryRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
      summaryRow.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
      summaryRow.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `giao-dich-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Đã xuất ${allTransactions.length} giao dịch thành công!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi xuất báo cáo');
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý xác nhận thanh toán
  const handleConfirmPayment = async () => {
    if (transactionToConfirm) {
      await confirmPayment(transactionToConfirm.id);
      setTransactionToConfirm(null);
    }
  };

  // Cấu hình tabs lọc theo trạng thái
  const activeTab = params.status || 'ALL';
  const tabs: { id: TransactionStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SUCCESS', label: 'Thành công' },
    { id: 'PENDING', label: 'Chờ xử lý' },
    { id: 'FAILED', label: 'Thất bại' },
  ];

  // Kiểm tra bộ lọc nâng cao có đang active không
  const hasAdvancedFilters = !!(params.paymentMethod || params.fromDate || params.toDate);

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Lịch sử giao dịch"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Lịch sử giao dịch' },
          ]}
        />

        {/* Nút xuất Excel */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToExcel}
          disabled={transactions.length === 0 || isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-emerald-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <FileSpreadsheet size={16} />
              Xuất báo cáo
            </>
          )}
        </motion.button>
      </div>

      {/* ====== Thống kê dòng tiền ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng doanh thu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp size={18} />
              </div>
              <span className="text-sm font-medium text-white/80">Tổng doanh thu</span>
            </div>
            {isStatsLoading ? (
              <div className="h-8 w-40 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
            )}
          </div>
        </motion.div>

        {/* Chuyển khoản (SEPAY) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-sky-600 rounded-2xl p-5 text-white shadow-lg shadow-cyan-500/20"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building2 size={18} />
              </div>
              <span className="text-sm font-medium text-white/80">Chuyển khoản</span>
            </div>
            {isStatsLoading ? (
              <div className="h-7 w-32 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-bold">{formatCurrency(stats?.byPaymentMethod?.SEPAY || 0)}</p>
            )}
          </div>
        </motion.div>

        {/* VNPAY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard size={18} />
              </div>
              <span className="text-sm font-medium text-white/80">VNPAY</span>
            </div>
            {isStatsLoading ? (
              <div className="h-7 w-32 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-bold">{formatCurrency(stats?.byPaymentMethod?.VNPAY || 0)}</p>
            )}
          </div>
        </motion.div>

        {/* MOMO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-pink-500/20"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Smartphone size={18} />
              </div>
              <span className="text-sm font-medium text-white/80">MOMO</span>
            </div>
            {isStatsLoading ? (
              <div className="h-7 w-32 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-bold">{formatCurrency(stats?.byPaymentMethod?.MOMO || 0)}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ====== Bảng dữ liệu chính ====== */}
      <div className="bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden lg:overflow-visible flex flex-col">
        {/* Tabs lọc + Tìm kiếm */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-end px-4 pt-2">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => updateFilters({ status: tab.id === 'ALL' ? undefined : tab.id })}
                className={`flex-shrink-0 pb-3 pt-2 text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabTransaction" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto pb-3">
            <div className="relative flex-1 sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:border-transparent dark:text-white placeholder-gray-400 outline-none"
                placeholder="Tìm tên, SĐT hoặc mã giao dịch..."
                value={params.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              />
            </div>

            {/* Bộ lọc nâng cao */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${isFilterOpen || hasAdvancedFilters
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Filter size={16} />
                {hasAdvancedFilters && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    {/* Overlay để đóng popup khi click ra ngoài */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsFilterOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">Bộ lọc nâng cao</span>
                        {hasAdvancedFilters && (
                          <button
                            onClick={() => updateFilters({ paymentMethod: undefined, fromDate: undefined, toDate: undefined })}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <FilterX size={12} />
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 relative z-10">
                        {/* Lọc phương thức */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Phương thức thanh toán
                          </label>
                          <select
                            value={params.paymentMethod || ''}
                            onChange={(e) => updateFilters({ paymentMethod: (e.target.value as PaymentMethod) || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="">Tất cả phương thức</option>
                            <option value="CASH">Tiền mặt (CASH)</option>
                            <option value="SEPAY">Chuyển khoản (SEPAY)</option>
                            <option value="VNPAY">VNPAY</option>
                            <option value="MOMO">MOMO</option>
                          </select>
                        </div>

                        {/* Lọc ngày */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={params.fromDate || ''}
                            onChange={(e) => updateFilters({ fromDate: e.target.value || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={params.toDate || ''}
                            onChange={(e) => updateFilters({ toDate: e.target.value || undefined })}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ====== Bảng dữ liệu chi tiết ====== */}
        <div className="overflow-x-auto lg:overflow-visible min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã GD</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold">Người thanh toán</th>
                <th className="px-6 py-4 font-semibold">Nội dung</th>
                <th className="px-6 py-4 font-semibold">Phương thức</th>
                <th className="px-6 py-4 font-semibold text-right">Số tiền</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {transactions.map((txn: Transaction) => (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Mã GD */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md" title={txn.id}>
                          {txn.transactionCode}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs">
                        {formatDateTime(txn.createdAt)}
                      </td>

                      {/* Người thanh toán */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{txn.user.fullName}</p>
                          {txn.user.phone && (
                            <p className="text-xs text-gray-400">{txn.user.phone}</p>
                          )}
                        </div>
                      </td>

                      {/* Nội dung */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-[200px]" title={`${txn.ticket.ticketType === 'MONTHLY' ? 'Vé tháng' : 'Vé lượt'} - ${txn.ticket.route.name}`}>
                            {txn.ticket.ticketType === 'MONTHLY' ? 'Vé tháng' : 'Vé lượt'} - {txn.ticket.route.name}
                          </span>
                        </div>
                      </td>

                      {/* Phương thức */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentBadge method={txn.paymentMethod} />
                      </td>

                      {/* Số tiền */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(txn.finalAmount)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={txn.status} />
                      </td>

                      {/* ====== Thao tác ====== */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === txn.id ? null : txn.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === txn.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                                >
                                  {/* Xem chi tiết */}
                                  <button
                                    onClick={() => { setDetailTransaction(txn); setOpenMenuId(null); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <Eye size={15} className="text-blue-500" />
                                    Xem chi tiết hóa đơn
                                  </button>

                                  {/* Xác nhận thanh toán - chỉ hiện cho PENDING + CASH/SEPAY */}
                                  {txn.status === 'PENDING' && (txn.paymentMethod === 'CASH' || txn.paymentMethod === 'SEPAY') && (
                                    <button
                                      onClick={() => { setTransactionToConfirm(txn); setOpenMenuId(null); }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                      <CheckCircle2 size={15} />
                                      Xác nhận đã thu tiền
                                    </button>
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}

              {/* Trạng thái rỗng */}
              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt size={32} className="text-gray-300 dark:text-gray-600" />
                      <p>Không tìm thấy giao dịch nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalItems={total}
            limit={limit}
            showingCount={transactions.length}
            onPageChange={changePage}
          />
        )}
      </div>

      {/* ====== Modal xem chi tiết hóa đơn ====== */}
      <AnimatePresence>
        {detailTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
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
                <button
                  onClick={() => setDetailTransaction(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Người thanh toán</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.user.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Nội dung</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.ticket.ticketType === 'MONTHLY' ? 'Vé tháng' : 'Vé lượt'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tuyến xe</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailTransaction.ticket.route.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phương thức</span>
                    <PaymentBadge method={detailTransaction.paymentMethod} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <StatusBadge status={detailTransaction.status} />
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
                    <span className="font-medium text-red-500">-{formatCurrency(detailTransaction.discountAmount)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Thực thu</span>
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(detailTransaction.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDetailTransaction(null)}
                  className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====== Modal xác nhận thanh toán ====== */}
      <ConfirmModal
        isOpen={!!transactionToConfirm}
        onClose={() => setTransactionToConfirm(null)}
        onConfirm={handleConfirmPayment}
        title="Xác nhận đã thu tiền"
        description={`Xác nhận đã thu ${transactionToConfirm ? formatCurrency(transactionToConfirm.finalAmount) : ''} từ "${transactionToConfirm?.user?.fullName || 'Người dùng'}" bằng phương thức ${transactionToConfirm ? paymentMethodConfig[transactionToConfirm.paymentMethod].label : ''}? Hệ thống sẽ tự động kích hoạt vé.`}
        confirmText="Xác nhận đã thu"
        icon={CheckCircle2}
        variant="info"
      />
    </PageWrapper>
  );
}
