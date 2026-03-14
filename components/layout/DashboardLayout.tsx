'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Layout tổng hợp: Sidebar + Header + Content
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Khu vực nội dung chính */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isSidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex min-h-screen flex-col"
      >
        <Header />

        {/* Nội dung trang */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
