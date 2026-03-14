'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  index: number;
}

// Variants cho animation stagger
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

// Thẻ thống kê với hiệu ứng stagger và hover scale
export default function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconColor,
  index,
}: StatCardProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700/40 dark:bg-gray-900"
    >
      {/* Gradient background decoration */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20 ${gradient}`}
      />

      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </p>
        </div>

        {/* Icon container */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${gradient}`}
        >
          <Icon size={26} className={iconColor} />
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-full opacity-60 ${gradient}`}
      />
    </motion.div>
  );
}
