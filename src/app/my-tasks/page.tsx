// src/app/my-tasks/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Project, AppUser } from '../../lib/types';
// TODO: Refactor to use Azure services
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../hooks/use-toast';
import { Card } from '@/components/ui/card';
import { OnboardingTracker } from '@/components/onboarding-tracker';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { getCurrentStageName } from '../../lib/onboarding';


function AssignedProjectCard({ project }: { project: Project }) {
    const router = useRouter();
    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.projectTypeName} - Current Stage: {getCurrentStageName(project)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
                <OnboardingTracker stages={project.stages} />
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push(`/projects/${project.id}`)}>
                    View Details
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function MyTasksPage() {
  const { appUser, hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
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
        // Admins can see all projects, others see projects based on their role's projectTypeIds
        const accessibleProjectTypeIds = hasPermission('manage_all') ? undefined : appUser.role?.projectTypeIds;
        const fetchedProjects = await getProjects(appUser.companyId, accessibleProjectTypeIds);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch your assigned projects.',
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

  const myProjects = useMemo(() => {
    if (!appUser) return [];
    return projects.filter(p => p.assignedUserId === appUser.uid);
  }, [projects, appUser]);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            A list of all projects currently assigned to you.
          </p>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : myProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <h2 className="text-xl font-medium text-muted-foreground">
              You have no assigned projects
            </h2>
            <p className="text-muted-foreground">
              Once a project is assigned to you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myProjects.map(project => (
              <AssignedProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
