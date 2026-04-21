import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';

// Font Inter hiện đại, tối ưu cho dashboard
const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'Quản lý Xe buýt Trường học',
  description: 'Hệ thống quản lý xe buýt trường học - Bảng điều khiển Admin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
