'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePopularRoutes } from '@/hooks/useDashboard';
import { Route } from 'lucide-react';

// Gradient colors cho các thanh
const barColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; routeCode: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {payload[0].payload.routeCode} - {payload[0].payload.name}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {payload[0].value} vé đã bán
        </p>
      </div>
    );
  }
  return null;
}

export default function PopularRoutesChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { popularRoutes, isLoading } = usePopularRoutes();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  if (!mounted || isLoading) {
    return (
      <div className="h-[350px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900 h-full flex flex-col"
    >
      {/* Tiêu đề */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tuyến đường phổ biến
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Top 5 tuyến có nhiều vé đăng ký nhất
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-500/10">
          <Route size={18} className="text-blue-500" />
        </div>
      </div>

      {popularRoutes.length > 0 ? (
        <div className="flex-1 flex flex-col gap-6">
          {/* Bar Chart */}
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularRoutes} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  dataKey="routeCode"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1f2937' : '#f3f4f6' }} />
                <Bar dataKey="ticketCount" radius={[0, 6, 6, 0]} barSize={22}>
                  {popularRoutes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-[250px] items-center justify-center text-gray-400 dark:text-gray-500">
          Chưa có dữ liệu tuyến đường
        </div>
      )}
    </motion.div>
  );
}
