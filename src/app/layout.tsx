import { Inter } from 'next/font/google';
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'System Treningowy',
  description: 'Nowoczesny system zarządzania treningami',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>
          <AdminPanelLayout>{children}</AdminPanelLayout>
      </body>
    </html>
  );
}