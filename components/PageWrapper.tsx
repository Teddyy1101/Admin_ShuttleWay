'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageWrapperProps {
  children: ReactNode;
}

// Component bọc nội dung trang với hiệu ứng chuyển trang
export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
