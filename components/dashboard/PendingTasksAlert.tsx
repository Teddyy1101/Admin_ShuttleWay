'use client';

import { motion } from 'framer-motion';
import { usePendingTasks } from '@/hooks/useDashboard';
import { AlertTriangle, FileText, Headphones, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PendingTasksAlert() {
  const { pendingTasks, isLoading } = usePendingTasks();

  // Không hiển thị nếu đang loading hoặc không có gì cần xử lý
  if (isLoading || !pendingTasks || pendingTasks.total === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-6 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-800/40 dark:from-amber-950/30 dark:to-orange-950/30"
    >
      <div className="flex items-center gap-3">
        {/* Icon cảnh báo */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
        </div>

        {/* Nội dung */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Bạn có {pendingTasks.total} công việc cần xử lý
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {pendingTasks.pendingLeaves > 0 && (
              <Link
                href="/requests/absence"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm transition-all hover:bg-white hover:shadow-md dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <FileText size={14} />
                {pendingTasks.pendingLeaves} đơn xin nghỉ chưa duyệt
                <ChevronRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )}
            {pendingTasks.openSupport > 0 && (
              <Link
                href="/support"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-orange-700 shadow-sm transition-all hover:bg-white hover:shadow-md dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
              >
                <Headphones size={14} />
                {pendingTasks.openSupport} yêu cầu hỗ trợ đang mở
                <ChevronRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
