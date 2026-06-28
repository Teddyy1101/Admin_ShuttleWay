'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { usePunctualityStats } from '@/hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const COLORS = {
  onTime: '#10b981',  // Emerald
  late: '#ef4444',     // Red
};

// Helper: format Date thành YYYY-MM-DD cho input[type=date]
function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Custom tooltip
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
        <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
          {payload[0].value} <span className="text-sm font-normal text-gray-500">chuyến</span>
        </p>
      </div>
    );
  }
  return null;
}

import { useDashboardFilter } from '@/hooks/useDashboardFilter';

export default function PunctualityChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { punctualityData, isLoading } = usePunctualityStats();

  // Dùng global filter cho tỷ lệ đúng giờ
  const { punctualityStartDate: startDate, punctualityEndDate: endDate, setPunctualityStart: setStartDate, setPunctualityEnd: setEndDate } = useDashboardFilter();
  const [activePreset, setActivePreset] = useState<number | null>(30); // 30 ngày

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Chọn preset nhanh
  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
    setActivePreset(days);
  };

  // Tính toán số liệu dựa trên filter ngày (chỉ lọc trên frontend)
  const punctuality = useMemo(() => {
    if (!punctualityData || punctualityData.length === 0) return null;

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    let onTime = 0;
    let late = 0;

    for (const day of punctualityData) {
      const dayTime = new Date(day.date).getTime();
      if (dayTime >= startTime && dayTime <= endTime) {
        onTime += day.onTime;
        late += day.late;
      }
    }

    const total = onTime + late;
    const onTimePercent = total > 0 ? Math.round((onTime / total) * 100 * 10) / 10 : 0;

    return { onTime, late, total, onTimePercent };
  }, [punctualityData, startDate, endDate]);

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
      className="flex h-full flex-col rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900"
    >
      {/* Header + Bộ lọc */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Clock size={18} className="text-emerald-500" />
            Tỷ lệ đúng giờ
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {punctuality?.total || 0} chuyến đi hoàn thành
          </p>
        </div>

        {/* Nút lọc ngày (Chỉ lọc trên Frontend) */}
        <div className="flex flex-col items-end gap-2">
          {/* Nút Chọn Nhanh */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => handlePreset(days)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  activePreset === days
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {days} ngày
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset(null);
                }}
                className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset(null);
                }}
                className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ + số liệu */}
      {!punctuality || punctuality.total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          Chưa có dữ liệu chuyến đi trong thời gian này
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {/* Donut chart với % ở giữa */}
          <div className="relative h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Đúng giờ', value: punctuality.onTime, color: COLORS.onTime },
                    { name: 'Trễ giờ', value: punctuality.late, color: COLORS.late },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke={isDark ? '#111827' : '#ffffff'}
                  strokeWidth={3}
                >
                  <Cell fill={COLORS.onTime} />
                  <Cell fill={COLORS.late} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Percent ở giữa donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-3xl font-bold ${
                  punctuality.onTimePercent >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {punctuality.onTimePercent}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">đúng giờ</span>
            </div>
          </div>

          {/* Legend cards */}
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Đúng giờ
                </span>
              </div>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {punctuality.onTime}
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-center dark:border-red-900/30 dark:bg-red-900/10">
              <div className="flex items-center justify-center gap-1.5">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-xs font-medium text-red-700 dark:text-red-300">
                  Trễ giờ
                </span>
              </div>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                {punctuality.late}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
