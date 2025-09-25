// src/components/email-templates-page.tsx
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
import { MoreHorizontal, Loader2, Trash2, Edit } from 'lucide-react';
import type { EmailTemplate, ProjectType } from '@/lib/types';
import { 
    createEmailTemplate, 
    getEmailTemplates,
    updateEmailTemplate,
    deleteEmailTemplate,
    getProjectTypes
} from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from './ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { NewEmailTemplateDialog } from './email-templates/email-template-dialog';
import { Badge } from './ui/badge';


export function EmailTemplatesPage() {
  const { appUser, hasPermission } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  const [isDialogOpeng, setIsDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);


  const fetchData = async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      const [fetchedTemplates, fetchedProjectTypes] = await Promise.all([
        getEmailTemplates(appUser.companyId),
        getProjectTypes(appUser.companyId)
      ]);
      setTemplates(fetchedTemplates);
      setProjectTypes(fetchedProjectTypes);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({
        title: 'Error Loading Data',
        description: 'Could not fetch your templates.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appUser]);

  const handleCreateOrUpdate = async (data: Omit<EmailTemplate, 'id' | 'companyId' | 'createdAt'>, id?: string) => {
    if (!appUser?.companyId) return;
    
    const canPerformAction = id ? hasPermission('edit_email_templates') : hasPermission('edit_email_templates');
    if (!canPerformAction) {
        toast({ title: "Permission Denied", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
        if (id) {
            await updateEmailTemplate(id, data);
            toast({ title: 'Template Updated!' });
        } else {
            await createEmailTemplate(appUser.companyId, data);
            toast({ title: 'Template Created!' });
        }
        await fetchData();
        return true; // Indicate success
    } catch (error) {
        console.error("Failed to save template", error);
        toast({ title: 'Save Failed', variant: 'destructive' });
        return false; // Indicate failure
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEmailTemplate(templateToDelete.id);
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      toast({
        title: 'Template Deleted',
        description: `"${templateToDelete.name}" was successfully deleted.`,
      });
    } catch(error) {
      console.error("Failed to delete template", error);
      toast({
        title: 'Error Deleting Template',
        description: 'Could not delete the template.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  }
  
  const openDeleteDialog = (template: EmailTemplate) => {
      if (!hasPermission('delete_email_templates')) {
          toast({ title: "Permission Denied", variant: 'destructive' });
          return;
      }
      setTemplateToDelete(template);
  }

  const openEditDialog = (template: EmailTemplate) => {
      if (!hasPermission('edit_email_templates')) {
          toast({ title: "Permission Denied", variant: 'destructive' });
          return;
      }
      setTemplateToEdit(template);
      setIsDialogOpen(true);
  }
  
  const getProjectTypeName = (projectTypeId: string) => {
      return projectTypes.find(pt => pt.id === projectTypeId)?.name || 'Unknown Type';
  }


  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable emails for your workflows.
            </p>
          </div>
          <NewEmailTemplateDialog
            isOpen={isDialogOpeng && !templateToEdit}
            onOpenChange={(open) => {
                if (!open) setTemplateToEdit(null);
                setIsDialogOpen(open);
            }}
            onSave={handleCreateOrUpdate}
            projectTypes={projectTypes}
            isSubmitting={isSubmitting}
            triggerButtonText="New Template"
            canEdit={hasPermission('edit_email_templates')}
          />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Card>
            <CardContent className="p-0">
                {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
                ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <h2 className="text-xl font-medium text-muted-foreground">
                    No email templates yet
                    </h2>
                    <p className="text-muted-foreground">
                    Click "New Template" to get started.
                    </p>
                </div>
                ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {templates.map(template => (
                        <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell><Badge variant="outline">{getProjectTypeName(template.projectTypeId)}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{template.stageName}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <MoreHorizontal />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => openDeleteDialog(template)}
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
            </CardContent>
          </Card>
        </main>
      </div>

       {templateToEdit && (
            <NewEmailTemplateDialog
                isOpen={isDialogOpeng && !!templateToEdit}
                onOpenChange={(open) => {
                    if (!open) setTemplateToEdit(null);
                    setIsDialogOpen(open);
                }}
                onSave={(data) => handleCreateOrUpdate(data, templateToEdit.id)}
                projectTypes={projectTypes}
                isSubmitting={isSubmitting}
                template={templateToEdit}
                triggerButtonText='Edit Template'
                canEdit={hasPermission('edit_email_templates')}
            />
       )}
      
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={open => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <strong> "{templateToDelete?.name}" </strong>
              email template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteTemplate}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
