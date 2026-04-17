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
import { useEffect, useState } from 'react';
import { useRevenueChart } from '@/hooks/useDashboard';

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

// Biểu đồ doanh thu 7 ngày gần nhất — dữ liệu thực từ API
export default function RevenueChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { revenueData, isLoading } = useRevenueChart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

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
  if (!mounted || isLoading) {
    return (
      <div className="h-[350px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900"
    >
      {/* Tiêu đề */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Doanh thu 7 ngày gần nhất
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Biểu đồ theo dõi doanh thu hàng ngày
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

      {/* Biểu đồ */}
      {revenueData.length > 0 ? (
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
          Chưa có dữ liệu doanh thu
        </div>
      )}
    </motion.div>
  );
}
