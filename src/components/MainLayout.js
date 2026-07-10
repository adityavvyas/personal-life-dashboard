'use client';
import { useSupabase } from '@/context/SupabaseContext';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function MainLayout({ children }) {
  const { isAuthenticated } = useSupabase();
  const pathname = usePathname();
  
  const showNav = isAuthenticated && pathname !== '/login';

  return (
    <div className="layout-container" suppressHydrationWarning>
      {showNav && <Navigation />}
      <main className={`main-content ${showNav ? 'authenticated' : ''}`} suppressHydrationWarning>
        {children}
      </main>
    </div>
  );
}
