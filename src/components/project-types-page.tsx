// src/components/project-types-page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { MoreHorizontal, Loader2, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import type { ProjectType } from '@/lib/types';
import { createProjectType, deleteProjectType, getProjectTypes, updateProjectType } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewProjectTypeDialog } from './project-types/new-project-type-dialog';
import { EditProjectTypeDialog } from './project-types/edit-project-type-dialog';
import { useAuth } from '@/context/auth-context';

export function ProjectTypesPage() {
  const { appUser } = useAuth();
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ProjectType | null>(null);
  const [typeToEdit, setTypeToEdit] = useState<ProjectType | null>(null);
  const { toast } = useToast();

  const fetchProjectTypes = async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      let fetchedTypes = await getProjectTypes(appUser.companyId);
      setProjectTypes(fetchedTypes);
    } catch (error) {
      console.error('Failed to fetch project types', error);
      toast({
        title: 'Error Loading Data',
        description: 'Could not fetch your project types.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appUser?.companyId) {
        fetchProjectTypes();
    }
  }, [appUser]);

  const handleCreateProjectType = async (name: string, stages: string[], isSales: boolean) => {
    if (!appUser?.companyId) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to create a project type.', variant: 'destructive' });
        return;
    }
    try {
      await createProjectType(appUser.companyId, name, stages, isSales);
      toast({
        title: 'Project Type Created!',
        description: `Successfully created "${name}".`,
      });
      fetchProjectTypes(); // Refresh the list
    } catch (error) {
      console.error('Failed to create project type', error);
      toast({
        title: 'Error Creating Project Type',
        description: 'There was a problem creating the new type.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateProjectType = async (id: string, name: string, stages: string[], isSales: boolean) => {
    try {
        await updateProjectType(id, name, stages, isSales);
        toast({
            title: 'Project Type Updated!',
            description: `Successfully updated "${name}".`,
        });
        fetchProjectTypes(); // Refresh list
    } catch (error) {
        console.error("Failed to update project type:", error);
        toast({ title: 'Update Failed', description: 'Could not save changes.', variant: 'destructive' });
    }
  }


  const handleDeleteProjectType = async () => {
    if (!typeToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProjectType(typeToDelete.id);
      toast({
        title: 'Project Type Deleted',
        description: `Successfully deleted "${typeToDelete.name}".`,
      });
      setProjectTypes(projectTypes.filter(type => type.id !== typeToDelete.id));
      setTypeToDelete(null);
    } catch (error) {
      console.error('Failed to delete project type', error);
      toast({
        title: 'Error Deleting Project Type',
        description: 'There was a problem deleting the type.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
        <div className="flex flex-col h-full bg-background">
          <header className="flex items-center justify-between p-4 sm:p-6 border-b">
            <div>
              <h1 className="text-2xl font-bold">Project Type Management</h1>
              <p className="text-muted-foreground">
                Define the workflows and Kanban stages for your business.
              </p>
            </div>
            <NewProjectTypeDialog onCreateProjectType={handleCreateProjectType} />
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : projectTypes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <h2 className="text-xl font-medium text-muted-foreground">
                        No project types yet
                      </h2>
                      <p className="text-muted-foreground">
                        Click "New Project Type" to define a workflow.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type Name</TableHead>
                          <TableHead>Is Sales-Related</TableHead>
                          <TableHead>Stages</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectTypes.map(type => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">
                              {type.name}
                            </TableCell>
                            <TableCell>
                                {type.isSales ? 
                                    <CheckCircle className="h-5 w-5 text-green-500" /> : 
                                    <XCircle className="h-5 w-5 text-muted-foreground" />
                                }
                            </TableCell>
                            <TableCell>
                              {type.stages.join(' → ')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setTypeToEdit(type)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setTypeToDelete(type)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
          <AlertDialog
            open={!!typeToDelete}
            onOpenChange={open => !open && setTypeToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  <strong> "{typeToDelete?.name}" </strong>
                  project type.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={handleDeleteProjectType}
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
        </div>

        {typeToEdit && (
            <EditProjectTypeDialog
                projectType={typeToEdit}
                onUpdateProjectType={handleUpdateProjectType}
                isOpen={!!typeToEdit}
                onOpenChange={(open) => !open && setTypeToEdit(null)}
            />
        )}
    </>
  );
}
