import { create } from 'zustand';

// Helper: format Date thành YYYY-MM-DD
function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const defaultEnd = new Date();
const defaultStart = new Date();
defaultStart.setDate(defaultEnd.getDate() - 30); // Mặc định 30 ngày gần nhất cho đúng giờ
const defaultRevenueStart = new Date();
defaultRevenueStart.setMonth(defaultEnd.getMonth() - 5); // Mặc định 6 tháng cho doanh thu

interface DashboardFilterState {
  revenueStartDate: string;
  revenueEndDate: string;
  setRevenueStart: (date: string) => void;
  setRevenueEnd: (date: string) => void;

  punctualityStartDate: string;
  punctualityEndDate: string;
  setPunctualityStart: (date: string) => void;
  setPunctualityEnd: (date: string) => void;
}

export const useDashboardFilter = create<DashboardFilterState>((set) => ({
  revenueStartDate: toDateInputValue(defaultRevenueStart),
  revenueEndDate: toDateInputValue(defaultEnd),
  setRevenueStart: (date) => set({ revenueStartDate: date }),
  setRevenueEnd: (date) => set({ revenueEndDate: date }),

  punctualityStartDate: toDateInputValue(defaultStart),
  punctualityEndDate: toDateInputValue(defaultEnd),
  setPunctualityStart: (date) => set({ punctualityStartDate: date }),
  setPunctualityEnd: (date) => set({ punctualityEndDate: date }),
}));
