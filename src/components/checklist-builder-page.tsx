
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
import { Loader2 } from 'lucide-react';
import type { ChecklistTemplate, ChecklistItem } from '../lib/types';
// Removed legacy Firebase import
import { useToast } from '../hooks/use-toast';
import { NewTemplateDialog } from './checklist-builder/new-template-dialog';
import { TemplateCard } from './checklist-builder/template-card';
import { useAuth } from '../context/auth-context';

export function ChecklistBuilderPage() {
  const { appUser } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ChecklistTemplate | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      if (!appUser?.companyId) return; // Wait for companyId
      setIsLoading(true);
      try {
        let fetchedTemplates = await getTemplates(appUser.companyId);

        if (fetchedTemplates.length === 0) {
          toast({ title: 'No templates found.', description: 'Creating a default template for you.' });
          // Default data creation is now handled on sign-up, so this might not be needed
          // but can be kept as a fallback.
        }
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Failed to fetch templates from Firestore", error);
        toast({
          title: 'Error Loading Templates',
          description: 'Could not fetch your checklist templates.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, [toast, appUser]);

  const handleCreateTemplate = async (name: string) => {
    if (!appUser?.companyId) return;
    try {
      await createTemplate(appUser.companyId, name);
      const fetchedTemplates = await getTemplates(appUser.companyId);
      setTemplates(fetchedTemplates);
      toast({
        title: 'Template Created!',
        description: `Successfully created "${name}".`,
      });
    } catch (error) {
      console.error("Failed to create template in Firestore", error);
      toast({
        title: 'Error Creating Template',
        description: 'Could not create the new template.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(templateToDelete.id);
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
  
  const openDeleteDialog = (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
          setTemplateToDelete(template);
      }
  }


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Checklist Builder</h1>
          <p className="text-muted-foreground">
            Create and manage your onboarding checklists.
          </p>
        </div>
        <NewTemplateDialog onCreateTemplate={handleCreateTemplate} />
      </header>
      <main className="flex-1 p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <h2 className="text-xl font-medium text-muted-foreground">
              No templates yet
            </h2>
            <p className="text-muted-foreground">
              Click "New Template" to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <TemplateCard key={template.id} template={template} onDelete={openDeleteDialog} />
            ))}
          </div>
        )}
      </main>
      
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
              checklist template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteTemplate}
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
  );
}
