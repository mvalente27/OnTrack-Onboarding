// src/components/dashboard-page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OnboardingTracker } from '@/components/onboarding-tracker';
import type { Project, Lead, LeadStage, ProjectType } from '@/lib/types';
import { getProjects, getLeads, getProjectTypes } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { LeadsByStageChart } from './dashboard/leads-by-stage-chart';
import { LeadsBySourceChart } from './dashboard/leads-by-source-chart';
import { useAuth } from '@/context/auth-context';
import { ProjectsByStageChart } from './dashboard/projects-by-stage-chart';
import { getCurrentStageName } from '@/lib/onboarding';


export function DashboardPage() {
  const { appUser, hasPermission } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!appUser) return;
      setIsLoading(true);
      try {
        const accessibleProjectTypeIds = hasPermission('manage_all') ? undefined : appUser.role?.projectTypeIds;

        const [fetchedProjects, fetchedLeads, fetchedProjectTypes] = await Promise.all([
          hasPermission('view_projects') ? getProjects(appUser.companyId, accessibleProjectTypeIds) : Promise.resolve([]),
          hasPermission('view_leads') ? getLeads(appUser.companyId, accessibleProjectTypeIds) : Promise.resolve([]),
          getProjectTypes(appUser.companyId), // Fetch all to show names, then filter
        ]);
        
        setAllProjects(fetchedProjects);
        setLeads(fetchedLeads);
        
        // Filter project types to only those the user can access
        const visibleProjectTypes = hasPermission('manage_all') 
            ? fetchedProjectTypes 
            : fetchedProjectTypes.filter(pt => accessibleProjectTypeIds?.includes(pt.id));
        setProjectTypes(visibleProjectTypes);

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        toast({
          title: 'Error Loading Dashboard',
          description: 'Could not fetch your project and lead data.',
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

  const overviewByProjectType = useMemo(() => {
    return projectTypes.map(pt => {
      // Sales-related data processing
      const filteredLeads = leads.filter(lead => lead.projectTypeId === pt.id);
      const leadsByStage = filteredLeads.reduce((acc, lead) => {
        const stage = lead.stage;
        if (stage !== 'Onboarding' && stage !== 'Closed') {
          acc[stage] = (acc[stage] || 0) + 1;
        }
        return acc;
      }, {} as Record<LeadStage, number>);
      const leadsBySource = filteredLeads.reduce((acc, lead) => {
        const source = lead.leadSource || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Non-sales project data processing
      const filteredProjects = allProjects.filter(p => p.projectTypeId === pt.id);
      const projectsByStage = filteredProjects.reduce((acc, project) => {
          const stageName = getCurrentStageName(project);
          acc[stageName] = (acc[stageName] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);


      return {
        projectType: pt,
        leadsByStageChartData: Object.entries(leadsByStage).map(([name, value]) => ({ name, count: value })),
        leadsBySourceChartData: Object.entries(leadsBySource).map(([name, count]) => ({ name, count })),
        projectsByStageChartData: pt.stages.map(stageName => ({
            name: stageName,
            count: projectsByStage[stageName] || 0,
        })),
      }
    });
  }, [leads, projectTypes, allProjects]);
  
  const recentProjects = useMemo(() => {
      // Sort by creation date descending and take the first 3
      return [...allProjects].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
  }, [allProjects]);


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b bg-card sm:bg-transparent">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">An overview of your leads and most recent active projects.</p>
        </div>
        {hasPermission('view_projects') && (
            <Button onClick={() => router.push('/projects')}>View All Projects</Button>
        )}
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
             {hasPermission('view_leads') && (
                overviewByProjectType.map(({ projectType, leadsByStageChartData, leadsBySourceChartData, projectsByStageChartData }) => (
                    <div key={projectType.id} className="space-y-6">
                        <h2 className="text-xl font-bold border-b pb-2">{projectType.name} Overview</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                           {projectType.isSales ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Lead Pipeline</CardTitle>
                                        <CardDescription>
                                            Sales leads for {projectType.name}.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {leadsByStageChartData.length > 0 ? (
                                        <LeadsByStageChart data={leadsByStageChartData} />
                                        ) : (
                                        <div className="flex flex-col items-center justify-center h-60 text-center">
                                            <h3 className="text-lg font-medium text-muted-foreground">No active leads in the pipeline.</h3>
                                        </div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Leads by Source</CardTitle>
                                        <CardDescription>
                                        Where leads for {projectType.name} are coming from.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {leadsBySourceChartData.length > 0 ? (
                                        <LeadsBySourceChart data={leadsBySourceChartData} />
                                        ) : (
                                        <div className="flex flex-col items-center justify-center h-60 text-center">
                                            <h3 className="text-lg font-medium text-muted-foreground">No lead source data available.</h3>
                                        </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                           ) : (
                                <Card className="md:col-span-2">
                                     <CardHeader>
                                        <CardTitle>Project Pipeline</CardTitle>
                                        <CardDescription>
                                            Active projects for {projectType.name}.
                                        </CardDescription>
                                    </CardHeader>
                                     <CardContent>
                                        {projectsByStageChartData.some(d => d.count > 0) ? (
                                            <ProjectsByStageChart data={projectsByStageChartData} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-60 text-center">
                                                <h3 className="text-lg font-medium text-muted-foreground">No active projects in this pipeline.</h3>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                           )}
                        </div>
                    </div>
                ))
             )}
             {hasPermission('view_projects') && (
                <div>
                    <h2 className="text-xl font-bold border-b pb-2 mb-6">Recent Projects</h2>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {recentProjects.length === 0 ? (
                            <div className="md:col-span-2 xl:col-span-3">
                                <Card className="flex flex-col items-center justify-center h-full min-h-80 border-2 border-dashed border-muted-foreground/30">
                                    <h2 className="text-xl font-medium text-muted-foreground">
                                    No active projects yet
                                    </h2>
                                    <p className="text-muted-foreground">
                                    New projects will appear here after being converted from leads.
                                    </p>
                                </Card>
                            </div>
                        ) : (
                            recentProjects.map(project => (
                            <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                                <CardHeader>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription>{project.projectTypeName} Status</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between gap-6">
                                <OnboardingTracker stages={project.stages} />
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/projects/${project.id}`)}>
                                    View Details
                                </Button>
                                </CardContent>
                            </Card>
                            ))
                        )}
                    </div>
                </div>
            )}
             {!hasPermission('view_leads') && !hasPermission('view_projects') && (
                 <div className="flex flex-col items-center justify-center h-full min-h-80 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <h2 className="text-xl font-medium text-muted-foreground">
                        Welcome to OnTrack!
                    </h2>
                    <p className="text-muted-foreground">
                        Your administrator has not yet assigned you any permissions.
                    </p>
                 </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
