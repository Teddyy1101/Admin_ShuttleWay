'use client';

// Skeleton loading đẹp mắt cho Dashboard
export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-900">
      {/* Tiêu đề skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
      {/* Chart area skeleton */}
      <div className="flex h-[300px] items-end gap-3 pt-4">
        {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t-lg bg-gray-200 dark:bg-gray-700"
            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// Dashboard Skeleton tổng hợp
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 thẻ thống kê skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Biểu đồ skeleton */}
      <ChartSkeleton />
    </div>
  );
}
