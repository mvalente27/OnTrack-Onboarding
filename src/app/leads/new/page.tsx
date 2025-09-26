// src/app/leads/new/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Label, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Loader2, ArrowLeft } from 'lucide-react';
// TODO: Refactor to use Azure services
import type { ChecklistTemplate, LeadSource, ProjectType } from '@/lib/types';
import {
  getProjectTypesAzure,
  getLeadSourcesAzure,
  getTemplatesAzure,
  createLeadAzure,
  createProjectAzure
} from '@/lib/azure/cosmos';
import { useToast } from '@/hooks';
import { useAuth } from '@/context';

export default function NewItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { appUser } = useAuth();
  
  // Data state
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);

  // Form state
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<string>('');
  const [itemName, setItemName] = useState(''); // Generic name for lead or project
  const [email, setEmail] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [unitCount, setUnitCount] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Control state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      if (!appUser?.companyId) return;
      setIsLoading(true);
      try {
        const [fetchedProjectTypes, fetchedLeadSources, fetchedTemplates] = await Promise.all([
          getProjectTypesAzure(appUser.companyId),
          getLeadSourcesAzure(appUser.companyId),
          getTemplatesAzure(appUser.companyId)
        ]);
        setProjectTypes(fetchedProjectTypes);
        setLeadSources(fetchedLeadSources);
        setTemplates(fetchedTemplates);

      } catch (error) {
        console.error('Failed to fetch initial data', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch required data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (appUser?.companyId) {
      loadInitialData();
    }
  }, [toast, appUser]);

  const selectedProjectType = useMemo(() => {
    return projectTypes.find(pt => pt.id === selectedProjectTypeId);
  }, [projectTypes, selectedProjectTypeId]);

  const handleSalesLeadSubmit = async () => {
    if (!selectedProjectTypeId || !itemName || !email || !appUser?.companyId) {
       toast({ title: 'Missing Information', description: 'Please provide a client name, email, and select a project type.', variant: 'destructive' });
       return;
    }
    const linkedTemplate = templates.find(t => t.projectTypeId === selectedProjectTypeId);
    if (!linkedTemplate) {
        toast({ title: "Template Missing", description: "The selected project type does not have a checklist template linked to it.", variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
  await createLeadAzure({
        companyId: appUser.companyId,
        projectTypeId: selectedProjectTypeId,
        templateId: linkedTemplate.id,
        formData: {}, // formData is legacy, keeping for type consistency
        clientName: itemName,
        email,
        stage: 'Potential Deal',
        leadSource: leadSource,
        unitCount: unitCount,
        notes: notes,
      });
      toast({ title: 'Lead Created!', description: 'The new lead has been successfully saved.' });
      router.push('/leads');
    } catch (error) {
      console.error('Failed to create lead', error);
      toast({ title: 'Error Creating Lead', description: 'There was a problem saving the lead.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectProjectSubmit = async () => {
     if (!selectedProjectTypeId || !itemName || !appUser?.companyId) {
       toast({ title: 'Missing Information', description: 'Please provide a project name and select a project type.', variant: 'destructive' });
       return;
    }
    const linkedTemplate = templates.find(t => t.projectTypeId === selectedProjectTypeId);
    if (!linkedTemplate) {
        toast({ title: "Template Missing", description: "The selected project type must have a checklist template linked to it.", variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        companyId: appUser.companyId,
        name: itemName,
        email, // Email is optional for non-sales projects but can be captured
        projectTypeId: selectedProjectTypeId,
        templateId: linkedTemplate.id,
        notes: notes,
      });
      toast({ title: 'Project Created!', description: 'The new project has been added to the pipeline.' });
      router.push('/projects');
    } catch (error) {
      console.error('Failed to create project', error);
      toast({ title: 'Error Creating Project', description: 'There was a problem creating the project.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectType?.isSales) {
        handleSalesLeadSubmit();
    } else {
        handleDirectProjectSubmit();
    }
  };

  const pageTitle = selectedProjectType?.isSales ? 'Add New Lead' : 'Start New Project';
  const pageDescription = selectedProjectType?.isSales 
    ? 'Fill out the form to create a new sales lead.'
    : 'Provide a name to create a new project directly in the pipeline.';

  return (
    <div className="flex flex-col h-full bg-background">
       <header className="flex items-center p-4 sm:p-6 border-b">
         <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="ml-4">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </header>
       <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Select a project type to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="project-type-select">Project Type</Label>
                <p className="text-xs text-muted-foreground">This determines the workflow and fields for the new item.</p>
                {isLoading ? (
                  <div className="flex items-center space-x-2 h-10">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading project types...</span>
                  </div>
                ) : (
                  <Select onValueChange={setSelectedProjectTypeId} value={selectedProjectTypeId} required>
                    <SelectTrigger id="project-type-select">
                      <SelectValue placeholder="Select a project type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {selectedProjectTypeId && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">{selectedProjectType?.isSales ? 'Client Name' : 'Project Name'}</Label>
                      <Input 
                        id="itemName" 
                        placeholder={selectedProjectType?.isSales ? 'Enter client name' : 'Enter project name'}
                        value={itemName} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{selectedProjectType?.isSales ? 'Client Email' : 'Contact Email (Optional)'}</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="Enter contact email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required={selectedProjectType?.isSales}
                      />
                    </div>
                  </div>

                  {selectedProjectType?.isSales && (
                     <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="leadSource">Lead Source</Label>
                         {isLoading ? (
                          <div className="flex items-center space-x-2 h-10">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                        <Select onValueChange={setLeadSource} value={leadSource}>
                            <SelectTrigger id="leadSource">
                              <SelectValue placeholder="Select a source..." />
                            </SelectTrigger>
                            <SelectContent>
                              {leadSources.map((source) => (
                                <SelectItem key={source.id} value={source.name}>
                                  {source.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitCount">Unit Count (Optional)</Label>
                        <Input 
                          id="unitCount" 
                          type="number"
                          placeholder="e.g. 50"
                          value={unitCount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitCount(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Add any relevant notes..."
                        value={notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : (selectedProjectType?.isSales ? 'Save Lead' : 'Create Project')}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}