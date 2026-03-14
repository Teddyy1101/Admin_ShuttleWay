'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
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
import { RevenueDataPoint } from '@/types/dashboard';

// Dữ liệu mô phỏng doanh thu 7 ngày
const mockRevenueData: RevenueDataPoint[] = [
  { date: '08/03', revenue: 4200000 },
  { date: '09/03', revenue: 5800000 },
  { date: '10/03', revenue: 3500000 },
  { date: '11/03', revenue: 7200000 },
  { date: '12/03', revenue: 6100000 },
  { date: '13/03', revenue: 8500000 },
  { date: '14/03', revenue: 9200000 },
];

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

// Biểu đồ doanh thu 7 ngày gần nhất
export default function RevenueChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Chờ mount để tránh hydration mismatch
  if (!mounted) {
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
        <div className="rounded-xl bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10">
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            +12.5%
          </span>
        </div>
      </div>

      {/* Biểu đồ */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={mockRevenueData}>
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
    </motion.div>
  );
}
