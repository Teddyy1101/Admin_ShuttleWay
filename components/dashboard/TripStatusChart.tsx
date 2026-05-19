'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTripStats } from '@/hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Car } from 'lucide-react';

const COLORS = {
  SCHEDULED: '#3b82f6', // Blue
  IN_PROGRESS: '#f59e0b', // Amber
  COMPLETED: '#10b981', // Emerald
  CANCELLED: '#ef4444', // Red
};

const LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp chạy',
  IN_PROGRESS: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

// Custom tooltip cho biểu đồ tròn
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {payload[0].name}
        </p>
        <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
          {payload[0].value} <span className="text-sm font-normal text-gray-500">chuyến</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function TripStatusChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { tripStats, isLoading } = useTripStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  if (!mounted || isLoading) {
    return (
      <div className="h-[400px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  // Chuyển đổi dữ liệu từ API sang định dạng cho Recharts
  const chartData = tripStats.map(stat => ({
    name: LABELS[stat.status] || stat.status,
    value: stat.count,
    color: COLORS[stat.status as keyof typeof COLORS] || '#9ca3af'
  })).sort((a, b) => b.value - a.value); // Sắp xếp giảm dần

  const totalTrips = tripStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900 h-full flex flex-col"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Car size={18} className="text-blue-500" />
            Tỷ lệ trạng thái chuyến đi
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thống kê tổng {totalTrips} chuyến đi trong hệ thống
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                stroke={isDark ? '#111827' : '#ffffff'}
                strokeWidth={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
            Chưa có dữ liệu chuyến đi
          </div>
        )}
      </div>
    </motion.div>
  );
}
