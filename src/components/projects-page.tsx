// src/components/projects-page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Project, ProjectType, AppUser } from '@/lib/types';
import { getProjects, deleteProject, getProjectTypes, getUsers } from '@/lib/firebase/services';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ProjectKanbanCard } from '@/components/projects/project-kanban-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PermissionDenied } from './auth/permission-denied';
import { getCurrentStageName } from '@/lib/onboarding';


export function ProjectsPage() {
  const { appUser, hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!appUser?.companyId || !hasPermission('view_projects')) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const accessibleProjectTypeIds = hasPermission('manage_all') ? undefined : appUser.role?.projectTypeIds;
        
        const [fetchedProjects, fetchedProjectTypes, fetchedUsers] = await Promise.all([
            getProjects(appUser.companyId, accessibleProjectTypeIds),
            getProjectTypes(appUser.companyId),
            getUsers(appUser.companyId),
        ]);
        
        setProjects(fetchedProjects);
        setUsers(fetchedUsers);

        // Filter project types to only those the user can access
        const visibleProjectTypes = hasPermission('manage_all') 
            ? fetchedProjectTypes 
            : fetchedProjectTypes.filter(pt => accessibleProjectTypeIds?.includes(pt.id));
        setProjectTypes(visibleProjectTypes);
        
        // Set the selected project type to the first available one
        if (visibleProjectTypes.length > 0 && !visibleProjectTypes.some(pt => pt.id === selectedProjectTypeId)) {
            setSelectedProjectTypeId(visibleProjectTypes[0].id);
        }

      } catch (error) {
        console.error('Failed to fetch data', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch your project or project type data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if(appUser) {
        loadData();
    }
  }, [toast, hasPermission, appUser, selectedProjectTypeId]);
  
  const openDeleteDialog = (project: Project) => {
    if (!hasPermission('delete_projects')) {
        toast({ title: 'Permission Denied', description: 'You do not have permission to delete projects.', variant: 'destructive' });
        return;
    }
    setProjectToDelete(project);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
        await deleteProject(projectToDelete.id);
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        toast({
            title: 'Project Deleted',
            description: `"${projectToDelete.name}" has been successfully removed.`,
        });
    } catch(error) {
      console.error("Failed to delete project", error);
      toast({
        title: 'Error Deleting Project',
        description: 'Could not delete the project.',
        variant: 'destructive',
      });
    } finally {
        setIsDeleting(false);
        setProjectToDelete(null);
    }
  }

  const selectedProjectType = useMemo(() => {
    return projectTypes.find(pt => pt.id === selectedProjectTypeId);
  }, [projectTypes, selectedProjectTypeId]);

  const filteredProjects = useMemo(() => {
    if (!selectedProjectTypeId) return [];
    return projects.filter(p => p.projectTypeId === selectedProjectTypeId);
  }, [projects, selectedProjectTypeId]);

  const projectsByStage = useMemo(() => {
    if (!selectedProjectType) return {};
    return selectedProjectType.stages.reduce((acc, stageName) => {
      acc[stageName] = filteredProjects.filter(project => getCurrentStageName(project) === stageName);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [selectedProjectType, filteredProjects]);
  
  const usersById = useMemo(() => {
      return users.reduce((acc, user) => {
          acc[user.uid] = user;
          return acc;
      }, {} as Record<string, AppUser>);
  }, [users]);


  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your active projects and workflows.</p>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!hasPermission('view_projects')) {
      return <PermissionDenied />;
  }

  return (
    <>
        <div className="flex flex-col h-full bg-background">
          <header className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
            <div>
              <h1 className="text-2xl font-bold">Project Pipeline</h1>
              <p className="text-muted-foreground">Track projects as they move through the custom stages.</p>
            </div>
             <div className="w-64">
                <Label>Project Type</Label>
                <Select value={selectedProjectTypeId} onValueChange={setSelectedProjectTypeId} disabled={projectTypes.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a project type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projectTypes.map(pt => (
                            <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
            {!selectedProjectType ? (
                 <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <h2 className="text-xl font-medium text-muted-foreground">
                        No Project Types Found
                    </h2>
                    <p className="text-muted-foreground">
                        Either no project types exist, or you do not have permission to view any.
                    </p>
                </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <h2 className="text-xl font-medium text-muted-foreground">
                  No active projects for this type
                </h2>
                <p className="text-muted-foreground">
                  New projects will appear here once they are created from a lead.
                </p>
              </div>
            ) : (
              <div className="grid grid-flow-col auto-cols-max gap-4 h-full">
                {selectedProjectType.stages.map(stageName => (
                    <div key={stageName} className="w-[300px] h-full flex flex-col">
                        <div className="p-2 font-semibold text-foreground flex items-center justify-between">
                            <h2 className="text-lg">{stageName}</h2>
                            <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                {projectsByStage[stageName]?.length || 0}
                            </span>
                        </div>
                        <div className="bg-muted/60 rounded-lg p-2 flex-1 flex flex-col gap-4 overflow-y-auto">
                            {projectsByStage[stageName]?.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                    No projects in this stage.
                                </div>
                            ) : (
                                projectsByStage[stageName].map(project => (
                                    <ProjectKanbanCard 
                                        key={project.id} 
                                        project={project} 
                                        usersById={usersById}
                                        onDelete={openDeleteDialog} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
              </div>
            )}
          </main>
        </div>

        <AlertDialog
            open={!!projectToDelete}
            onOpenChange={open => !open && setProjectToDelete(null)}
        >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the project
                  <strong> "{projectToDelete?.name}" </strong>
                  and all associated data, including uploaded files.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={handleDeleteProject}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
