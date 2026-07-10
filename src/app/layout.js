import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/context/SupabaseContext';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { LanguageProvider } from '@/context/LanguageProvider';
import { NotificationProvider } from '@/context/NotificationProvider';
import MainLayout from '@/components/MainLayout';


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata = {
  title: 'Personal Life Dashboard',
  description: 'Manage your finances and daily routines',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
              <ToastProvider>
                <SupabaseProvider>
                  <NotificationProvider>

                  <MainLayout>
                    {children}
                  </MainLayout>
                </NotificationProvider>
              </SupabaseProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
