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
import { useTopDrivers } from '@/hooks/useDashboard';
import { Trophy } from 'lucide-react';

// Gradient colors cho các cột bar chart
const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { fullName: string; avatarUrl: string | null } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {payload[0].payload.fullName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {payload[0].value} chuyến hoàn thành
        </p>
      </div>
    );
  }
  return null;
}

// Biểu đồ Top 5 tài xế có nhiều chuyến đi hoàn thành nhất
export default function TopDriversChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { topDrivers, isLoading } = useTopDrivers();

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
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900"
    >
      {/* Tiêu đề */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top 5 tài xế
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tài xế có nhiều chuyến đi hoàn thành nhất
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-500/10">
          <Trophy size={18} className="text-amber-500" />
        </div>
      </div>

      {topDrivers.length > 0 ? (
        <div className="space-y-5">
          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDrivers} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <YAxis
                dataKey="fullName"
                type="category"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1f2937' : '#f3f4f6' }} />
              <Bar dataKey="tripCount" radius={[0, 6, 6, 0]} barSize={24}>
                {topDrivers.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Danh sách chi tiết */}
          <div className="space-y-2">
            {topDrivers.map((driver, index) => (
              <div
                key={driver.id}
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {/* Hạng */}
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : index === 1
                        ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        : index === 2
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Avatar */}
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                  {driver.avatarUrl ? (
                    <img src={driver.avatarUrl} alt={driver.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {driver.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Tên */}
                <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                  {driver.fullName}
                </span>

                {/* Số chuyến */}
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {driver.tripCount} chuyến
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-[250px] items-center justify-center text-gray-400 dark:text-gray-500">
          Chưa có dữ liệu tài xế
        </div>
      )}
    </motion.div>
  );
}
