
// src/components/layout/app-shell.tsx
'use client'

import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { PrivateRoute } from '../auth/private-route';

const noSidebarRoutes = ['/login', '/signup', '/leads/[leadId]/form'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isFormPage = /^\/leads\/[^\/]+\/form$/.test(pathname);

  // Don't render the shell for login, signup, or the public lead form page
  if (pathname === '/login' || pathname === '/signup' || isFormPage) {
    return <>{children}</>;
  }

  return (
    <PrivateRoute>
        <SidebarProvider>
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    </PrivateRoute>
  );
}
