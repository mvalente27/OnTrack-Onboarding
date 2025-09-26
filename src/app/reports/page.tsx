// src/app/reports/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, User, Clock } from 'lucide-react';
import type { Project, AppUser } from '../../lib/types';
import { getProjectsAzure, getUsersAzure } from '../../lib/azure/cosmos';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import UserWorkloadChart from '../../components/reports/user-workload-chart';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { getCurrentStageName } from '../../lib/onboarding';
import { formatDistanceToNow } from 'date-fns';
import { PermissionDenied } from '../../components/auth/permission-denied';

export default function ReportsPage() {
  const { appUser, hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!appUser?.companyId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
  const accessibleProjectTypeIds = hasPermission() ? undefined : appUser.role?.projectTypeIds;
    const [fetchedProjects, fetchedUsers] = await Promise.all([
      getProjectsAzure(appUser.companyId, accessibleProjectTypeIds),
      getUsersAzure(appUser.companyId)
    ]);
        setProjects(fetchedProjects);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch data for reports.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (appUser) {
      loadData();
    }
  }, [toast, appUser, hasPermission]);

  const userWorkloadData = useMemo(() => {
    const activeProjects = projects.filter(p => !p.stages.every(s => s.status === 'completed'));
    
    const workload = users.map(user => {
        const assignedProjects = activeProjects.filter(p => p.assignedUserId === user.uid);
        return {
            name: user.displayName || user.email,
            count: assignedProjects.length
        };
    });

    const unassignedCount = activeProjects.filter(p => !p.assignedUserId).length;
    if (unassignedCount > 0) {
        workload.push({ name: 'Unassigned', count: unassignedCount });
    }
    
    return workload.filter(item => item.count > 0);
  }, [projects, users]);

  const projectsOverviewData = useMemo(() => {
      const usersById = users.reduce((acc, user) => {
          acc[user.uid] = user;
          return acc;
      }, {} as Record<string, AppUser>);

      return projects
        .filter(p => !p.stages.every(s => s.status === 'completed'))
        .map(p => ({
            id: p.id,
            name: p.name,
            currentStage: getCurrentStageName(p),
            assignedUser: p.assignedUserId ? (usersById[p.assignedUserId]?.displayName || usersById[p.assignedUserId]?.email) : 'Unassigned',
            age: formatDistanceToNow(p.createdAt.toDate(), { addSuffix: true }),
            projectTypeName: p.projectTypeName
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, users]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
  }
  
  // A generic permission check could be added here, e.g. 'view_reports'
  if (!hasPermission()) {
      return <PermissionDenied />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Get insights into your team's workload and project statuses.
          </p>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>User Workload</CardTitle>
                <CardDescription>Number of active projects assigned to each user.</CardDescription>
            </CardHeader>
            <CardContent>
                {userWorkloadData.length > 0 ? (
                    <UserWorkloadChart data={userWorkloadData} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                        <h3 className="text-lg font-medium text-muted-foreground">No assigned projects to display.</h3>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Active Projects Overview</CardTitle>
                <CardDescription>A list of all projects that are currently in progress.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Project Type</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsOverviewData.length > 0 ? (
                        projectsOverviewData.map(project => (
                        <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell><Badge>{project.projectTypeName}</Badge></TableCell>
                            <TableCell>{project.currentStage}</TableCell>
                            <TableCell className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>{project.assignedUser}</TableCell>
                            <TableCell className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>{project.age}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No active projects found.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
