'use client';
import { usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Các trang không cần layout Dashboard (như Login, Signup, Error pages)
  const noLayoutPaths = ['/login'];

  if (noLayoutPaths.includes(pathname)) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
