import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ToastProvider } from '@/hooks/toast';
import { CookieConsent } from '@/components/cookie-consent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clexpay - Crypto, Bills & Gift Cards',
  description: '3-in-1 fintech platform for crypto trading, bill payments, and gift card trading',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            {children}
            <CookieConsent />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
