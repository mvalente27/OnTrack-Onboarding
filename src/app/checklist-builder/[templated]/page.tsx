
// src/app/checklist-builder/[templateId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from '@/components/ui';
import { PlusCircle, Loader2, Wand2 } from 'lucide-react';
import React, { useEffect, useCallback, useTransition } from 'react';
import type { ChecklistItem, ChecklistTemplate, Role, ProjectType } from '@/lib/types';
import { useToast } from '@/hooks';
import {
  getTemplateAzure,
  getRolesAzure,
  getProjectTypesAzure,
  updateTemplateAzure
} from '@/lib/azure/cosmos';
import { TemplateItem } from './template-item';
import { useAuth } from '@/context';
import { suggestChecklistItemsFlow } from '@/ai/flows/suggest-checklist-items-flow';


export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const templateId = params.templateId as string;
  const { toast } = useToast();

  const [template, setTemplate] = React.useState<ChecklistTemplate | null>(null);
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [projectTypes, setProjectTypes] = React.useState<ProjectType[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggesting, startSuggestionTransition] = useTransition();


  const fetchTemplateData = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      const [currentTemplate, fetchedRoles, fetchedProjectTypes] = await Promise.all([
        getTemplateAzure(templateId),
        getRolesAzure(appUser.companyId),
        getProjectTypesAzure(appUser.companyId),
      ]);
      
      if (currentTemplate) {
        setTemplate(currentTemplate);
        setItems(currentTemplate.items);
        setSelectedProjectTypeId(currentTemplate.projectTypeId || '');
      } else {
        toast({
          title: 'Template not found',
          description: 'Could not find the requested template.',
          variant: 'destructive',
        });
        router.push('/checklist-builder');
      }

      setRoles(fetchedRoles);
      setProjectTypes(fetchedProjectTypes);
    } catch (error) {
      console.error('Failed to fetch template data', error);
      toast({
        title: 'Error Loading Data',
        description: 'There was a problem fetching the required data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [templateId, toast, router, appUser]);

  useEffect(() => {
    if (templateId && appUser?.companyId) {
      fetchTemplateData();
    }
  }, [templateId, appUser, fetchTemplateData]);

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      label: 'New Question',
      type: 'text',
      roleId: '',
      requiresFile: false,
      stageName: '',
    };
    setItems((prev) => [...prev, newItem]);
  };
  
  const handleSuggestItems = () => {
    if (!template) return;
    startSuggestionTransition(async () => {
        try {
            const result = await suggestChecklistItemsFlow({ templateName: template.name });
            const suggestedItems = result.items.map((item: any) => ({
                ...item,
                id: `item-${Date.now()}-${Math.random()}`,
                roleId: '',
                stageName: ''
            }));
            setItems(prev => [...prev, ...suggestedItems]);
            toast({ title: "AI Suggestions Added!", description: "Review and edit the new items as needed."});
        } catch (error) {
            console.error("Failed to suggest items", error);
            toast({ title: "Suggestion Failed", description: "Could not get AI suggestions at this time.", variant: "destructive"});
        }
    });
  }

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof ChecklistItem,
    value: string | boolean
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };
  
  const handleReorderItem = (index: number, direction: 'up' | 'down') => {
    setItems(prev => {
      const newItems = [...prev];
      const itemToMove = newItems[index];
      if (direction === 'up' && index > 0) {
        newItems.splice(index, 1);
        newItems.splice(index - 1, 0, itemToMove);
      } else if (direction === 'down' && index < newItems.length - 1) {
        newItems.splice(index, 1);
        newItems.splice(index + 1, 0, itemToMove);
      }
      return newItems;
    });
  };

  const handleSaveTemplate = async () => {
    if (!selectedProjectTypeId) {
        toast({ title: 'Project Type Required', description: 'Please assign this template to a project type before saving.', variant: 'destructive' });
        return;
    }
    setIsSaving(true);
    try {
  await updateTemplateAzure(templateId, items, selectedProjectTypeId);
      toast({
        title: 'Template Saved!',
        description: 'Your changes have been successfully saved.',
      });
      router.push('/checklist-builder');
    } catch (error) {
      console.error('Failed to save template to Firestore', error);
      toast({
        title: 'Error Saving!',
        description: 'Could not save your changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const availableStages = React.useMemo(() => {
    if (!selectedProjectTypeId) return [];
    const projectType = projectTypes.find(pt => pt.id === selectedProjectTypeId);
    return projectType?.stages || [];
  }, [selectedProjectTypeId, projectTypes]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Template not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Edit Template</h1>
          <p className="text-muted-foreground">
            Add and configure questions for: <strong>{template.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="project-type">Project Type</Label>
                <Select value={selectedProjectTypeId} onValueChange={setSelectedProjectTypeId}>
                    <SelectTrigger id="project-type">
                        <SelectValue placeholder="Assign a project type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projectTypes.map(pt => (
                            <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2 self-end">
                <Button variant="outline" onClick={handleSuggestItems} disabled={isSuggesting}>
                    {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Suggest Items
                </Button>
                <Button onClick={handleAddItem}>
                  <PlusCircle />
                  Add Question
                </Button>
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <h2 className="text-xl font-medium text-muted-foreground">
              Your checklist is empty
            </h2>
            <p className="text-muted-foreground mb-4">
              Click "Add Question" to start manually, or get a head start with AI.
            </p>
             <Button onClick={handleSuggestItems} disabled={isSuggesting}>
                {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                Suggest Items with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <TemplateItem
                key={item.id}
                item={item}
                roles={roles}
                availableStages={availableStages}
                index={index}
                totalItems={items.length}
                onItemChange={handleItemChange}
                onDeleteItem={handleDeleteItem}
                onReorderItem={handleReorderItem}
              />
            ))}
          </div>
        )}
      </main>
      <footer className="p-4 sm:p-6 border-t flex justify-end">
        <Button onClick={handleSaveTemplate} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : 'Save Template'}
        </Button>
      </footer>
    </div>
  );
}
