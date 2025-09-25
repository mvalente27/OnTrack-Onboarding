// src/components/layout/sidebar.tsx
'use client';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '../ui/sidebar';
import {
  Home,
  Users,
  Briefcase,
  Settings,
  LogOut,
  KanbanSquare,
  ClipboardCheck,
  Building,
  Target,
  FolderKanban,
  FolderGit2,
  Mails,
  ClipboardList,
  Calendar,
  LineChart,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';

const Logo = () => (
  <div className="flex items-center gap-2 px-2">
    <Briefcase className="w-6 h-6 text-primary" />
    <h2 className="text-lg font-semibold tracking-tighter">OnTrack</h2>
  </div>
);

export function AppSidebar() {
  const pathname = usePathname();
  const { signOutUser, hasPermission } = useAuth();
  const isActive = (path: string) => pathname.startsWith(path) && (pathname !== '/' || path === '/');

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'}>
              <Link href="/">
                <Home />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/my-tasks')}>
                <Link href="/my-tasks">
                  <ClipboardList />
                  My Tasks
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/calendar')}>
                    <Link href="/calendar">
                        <Calendar />
                        Calendar
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/reports')}>
                    <Link href="/reports">
                        <LineChart />
                        Reports
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          {hasPermission('view_leads') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/leads')}>
                <Link href="/leads">
                  <KanbanSquare />
                  Leads
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {hasPermission('view_projects') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/projects')}>
                <Link href="/projects">
                  <FolderGit2 />
                  Projects
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        
        {(hasPermission('view_templates') || hasPermission('view_roles') || hasPermission('view_users')) && (
            <SidebarGroup>
                <SidebarGroupLabel className="flex items-center">
                    <Settings className="mr-2" />
                    Settings
                </SidebarGroupLabel>
                <SidebarMenu>
                    {hasPermission('view_templates') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/checklist-builder')}>
                                <Link href="/checklist-builder">
                                <ClipboardCheck />
                                Checklist Builder
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                     {hasPermission('view_email_templates') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/email-templates')}>
                                <Link href="/email-templates">
                                <Mails />
                                Email Templates
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    {hasPermission('view_projects') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/project-types')}>
                                <Link href="/project-types">
                                <FolderKanban />
                                Project Types
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                     {hasPermission('view_roles') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/roles')}>
                                <Link href="/roles">
                                <Building />
                                Roles
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                     )}
                    {hasPermission('view_users') && (
                        <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive('/users')}>
                            <Link href="/users">
                            <Users />
                            Users
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                     {hasPermission('view_leads') && (
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/lead-sources')}>
                                <Link href="/lead-sources">
                                <Target />
                                Lead Sources
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                     )}
                </SidebarMenu>
            </SidebarGroup>
        )}

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOutUser}>
              <LogOut />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
