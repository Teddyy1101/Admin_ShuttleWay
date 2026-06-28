'use client';

import { motion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { useRevenueChart } from '@/hooks/useDashboard';
import { CalendarDays, RotateCcw } from 'lucide-react';

// Format tiền VND cho tooltip
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

// Custom tooltip cho biểu đồ
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

// Các preset nhanh để chọn khoảng thời gian
const PRESETS = [
  { label: '3 tháng', months: 3 },
  { label: '6 tháng', months: 6 },
  { label: '12 tháng', months: 12 },
] as const;

// Helper: format Date thành YYYY-MM-DD cho input[type=date]
function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: format ISO date
function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

import { useDashboardFilter } from '@/hooks/useDashboardFilter';

// Biểu đồ doanh thu — có lọc ngày
export default function RevenueChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Dùng global filter cho doanh thu
  const { revenueStartDate: startDate, revenueEndDate: endDate, setRevenueStart: setStartDate, setRevenueEnd: setEndDate } = useDashboardFilter();
  const [activePreset, setActivePreset] = useState<number>(6); // 6 tháng

  // Gọi hook với filter
  const { revenueData, isLoading } = useRevenueChart(
    toISODateString(new Date(startDate)),
    toISODateString(new Date(endDate)),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Chọn preset nhanh
  const handlePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setActivePreset(months);
  };

  // Reset về mặc định
  const handleReset = () => {
    handlePreset(6);
  };

  // Khi user thay đổi ngày thủ công, bỏ active preset
  const handleStartChange = (value: string) => {
    setStartDate(value);
    setActivePreset(0);
  };
  const handleEndChange = (value: string) => {
    setEndDate(value);
    setActivePreset(0);
  };

  // Tính phần trăm thay đổi doanh thu
  const getChangePercent = () => {
    if (revenueData.length < 2) return null;
    const first = revenueData[0].revenue;
    const last = revenueData[revenueData.length - 1].revenue;
    if (first === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - first) / first) * 100 * 10) / 10;
  };

  const changePercent = getChangePercent();

  // Chờ mount để tránh hydration mismatch
  if (!mounted) {
    return (
      <div className="h-[420px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900"
    >
      {/* Tiêu đề + % thay đổi */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Biểu đồ doanh thu
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Theo dõi doanh thu hàng tháng
          </p>
        </div>
        {changePercent !== null && (
          <div className={`rounded-xl px-3 py-1.5 ${changePercent >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
            <span className={`text-sm font-semibold ${changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {changePercent >= 0 ? '+' : ''}{changePercent}%
            </span>
          </div>
        )}
      </div>

      {/* Bộ lọc ngày */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Preset buttons */}
        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.months}
              onClick={() => handlePreset(preset.months)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activePreset === preset.months
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Date inputs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-indigo-400"
            />
          </div>
          <span className="text-xs text-gray-400">đến</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-indigo-400"
          />
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          title="Đặt lại mặc định"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Biểu đồ */}
      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
        </div>
      ) : revenueData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#374151' : '#e5e7eb'}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              tickFormatter={(value) =>
                `${(value / 1000000).toFixed(1)}M`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#colorRevenue)"
              dot={{
                fill: '#6366f1',
                stroke: isDark ? '#111827' : '#ffffff',
                strokeWidth: 3,
                r: 5,
              }}
              activeDot={{
                fill: '#6366f1',
                stroke: isDark ? '#111827' : '#ffffff',
                strokeWidth: 3,
                r: 7,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-400 dark:text-gray-500">
          Chưa có dữ liệu doanh thu trong khoảng thời gian này
        </div>
      )}
    </motion.div>
  );
}
