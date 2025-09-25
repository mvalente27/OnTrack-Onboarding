// src/app/projects/[projectId]/page.tsx
'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, updateProjectChecklist, getEmailTemplates, getUsers, assignUserToProject } from '@/lib/firebase/services';
import { getRoles } from '@/lib/firebase/services/roles';
import type { Project, ProjectChecklistItem, Role, OnboardingStage, EmailTemplate, AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Trash2, FileText, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectChecklistTable } from '@/components/projects/project-checklist-table';
import { uploadChecklistFile, deleteChecklistFile } from '@/lib/firebase/file-storage';
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
import { checkAndAdvanceStage, getCurrentStageName } from '@/lib/onboarding';
import { useAuth } from '@/context/auth-context';
import { MissingItemsReportDialog } from '@/components/projects/missing-items-report-dialog';
import { generateMissingItemsReport } from '@/ai/flows/generate-missing-items-report-flow';
import { deleteProject } from '@/lib/firebase/services/projects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { summarizeProjectStatus } from '@/ai/flows/summarize-project-status-flow';
import { ProjectSummaryDialog } from '@/components/projects/project-summary-dialog';


export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [checklist, setChecklist] = useState<ProjectChecklistItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssigning, startAssignmentTransition] = useTransition();

  
  // State for missing items report
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState('');

  // State for AI summary
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');

  
  const handleStageAdvancement = useCallback((newStages: OnboardingStage[]) => {
      setProject(prev => prev ? { ...prev, stages: newStages } : null);
      const newCurrentStage = newStages.find(s => s.status === 'in_progress');
      if (newCurrentStage) {
          toast({ 
              title: 'Stage Advanced!', 
              description: `${project?.name} moved to ${newCurrentStage.name}.`
          });
      }
  }, [toast, project?.name]);

  const runStageCheck = useCallback(async (currentChecklist: ProjectChecklistItem[], currentProject: Project | null) => {
    if (!currentProject) return;
    await checkAndAdvanceStage(currentProject, currentChecklist, handleStageAdvancement);
  }, [handleStageAdvancement]);


  const fetchProjectData = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      const fetchedProject = await getProject(projectId);

      if (fetchedProject) {
        setProject(fetchedProject);
        setChecklist(fetchedProject.checklist || []);
        
        // Fetch roles and templates in parallel after we have the project
        const [fetchedRoles, fetchedEmailTemplates, fetchedUsers] = await Promise.all([
          getRoles(appUser.companyId),
          getEmailTemplates(appUser.companyId, fetchedProject.projectTypeId),
          getUsers(appUser.companyId)
        ]);
        setRoles(fetchedRoles);
        setEmailTemplates(fetchedEmailTemplates);
        setUsers(fetchedUsers);

      } else {
        toast({
          title: 'Project not found',
          variant: 'destructive',
        });
        router.push('/projects');
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      toast({
        title: 'Error Loading Project',
        description: 'There was a problem fetching the project data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router, toast, appUser]);

  useEffect(() => {
    if (projectId && appUser?.companyId) {
        fetchProjectData();
    }
  }, [projectId, appUser, fetchProjectData]);

  const handleChecklistChange = (
    itemId: string,
    field: keyof ProjectChecklistItem,
    value: any
  ) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setChecklist(updatedChecklist);

    // If a status was changed to completed, check if we can advance the stage
    if (field === 'status' && value === 'completed') {
        runStageCheck(updatedChecklist, project);
    }
  };
  
  const handleFileUpload = async (itemId: string, file: File) => {
    if (!project) return;
    try {
      const fileUrl = await uploadChecklistFile(project.id, itemId, file);
      const updatedChecklist = checklist.map(item =>
        item.id === itemId ? { ...item, fileUrl, fileName: file.name, status: 'completed' as const } : item
      );
      setChecklist(updatedChecklist);
      
      toast({ title: "File Uploaded", description: `${file.name} has been successfully uploaded.` });
      
      // Check if we need to advance the onboarding stage
      await runStageCheck(updatedChecklist, project);

    } catch (error) {
      console.error("File upload failed", error);
      toast({ title: "Upload Failed", description: "Could not upload the file.", variant: "destructive" });
    }
  };

  const handleFileDelete = async (itemId: string) => {
    const itemToDelete = checklist.find(item => item.id === itemId);
    if (!itemToDelete || !itemToDelete.fileUrl) return;

    try {
      await deleteChecklistFile(itemToDelete.fileUrl);
      const updatedChecklist = checklist.map(item =>
        item.id === itemId ? { ...item, fileUrl: '', fileName: '' } : item
      );
      setChecklist(updatedChecklist);
      toast({ title: "File Removed", description: `${itemToDelete.fileName} has been removed.` });
    } catch (error) {
      console.error("File deletion failed", error);
      toast({ title: "Deletion Failed", description: "Could not remove the file.", variant: "destructive" });
    }
  };


  const handleSaveChanges = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await updateProjectChecklist(project.id, checklist);
      toast({
        title: 'Checklist Saved!',
        description: 'Your changes have been successfully saved.',
      });
      // Also check stages on manual save
      await runStageCheck(checklist, project);
    } catch (error) {
      console.error('Failed to save checklist:', error);
      toast({
        title: 'Error Saving',
        description: 'There was a problem saving your changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
        await deleteProject(project.id);
        toast({
            title: 'Project Deleted',
            description: `${project.name} has been successfully deleted.`,
        });
        router.push('/projects');
    } catch (error) {
        console.error("Failed to delete project:", error);
        toast({
            title: 'Deletion Failed',
            description: 'Could not delete the project.',
            variant: 'destructive',
        });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
    }
  }
  
  const handleGenerateReport = async () => {
    if (!project) return;
    setIsGeneratingReport(true);
    setIsReportDialogOpen(true);
    try {
      const result = await generateMissingItemsReport({
        projectName: project.name,
        items: checklist.map(item => ({ label: item.label, status: item.status })),
      });
      setReportContent(result.report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({ title: 'Report Generation Failed', variant: 'destructive' });
      setIsReportDialogOpen(false); // Close dialog on error
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!project) return;
    setIsGeneratingSummary(true);
    setIsSummaryDialogOpen(true);
    try {
      const assignedUsers = [...new Set(checklist.map(i => i.assignedUserId).filter(Boolean))];
      const projectManager = users.find(u => u.uid === project.assignedUserId);

      const result = await summarizeProjectStatus({
        projectName: project.name,
        currentStage: getCurrentStageName(project),
        totalTasks: checklist.length,
        completedTasks: checklist.filter(i => i.status === 'completed').length,
        inProgressTasks: checklist.filter(i => i.status === 'in_progress').length,
        pendingTasks: checklist.filter(i => i.status === 'pending').length,
        projectManager: projectManager?.displayName || 'Not assigned',
        taskAssignees: assignedUsers.map(uid => users.find(u => u.uid === uid)?.displayName || 'Unknown'),
      });
      setSummaryContent(result.summary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast({ title: 'Summary Generation Failed', variant: 'destructive' });
      setIsSummaryDialogOpen(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  const handleAssignUser = (userId: string) => {
    if (!project) return;
    startAssignmentTransition(async () => {
        const idToAssign = userId === 'unassigned' ? '' : userId;
        try {
            await assignUserToProject(project.id, idToAssign);
            setProject(prev => prev ? { ...prev, assignedUserId: idToAssign } : null);
            const assignedUser = users.find(u => u.uid === idToAssign);
            toast({
                title: 'Project Assigned!',
                description: assignedUser ? `${assignedUser?.displayName || 'User'} is now assigned to this project.` : 'Project is now unassigned.'
            });
        } catch (error) {
            console.error("Failed to assign user:", error);
            toast({ title: 'Assignment Failed', description: 'Could not assign user to the project.', variant: 'destructive' });
        }
    });
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Could not load project data.</p>
      </div>
    );
  }

  return (
    <>
        <div className="flex flex-col h-full bg-background">
          <header className="flex items-center justify-between p-4 sm:p-6 border-b">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <p className="text-muted-foreground">{project.projectTypeName} Checklist</p>
                </div>
                 <div className="grid w-full max-w-xs items-center gap-1.5 ml-4">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select value={project.assignedUserId || 'unassigned'} onValueChange={handleAssignUser} disabled={isAssigning}>
                        <SelectTrigger id="assignee">
                            <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.uid} value={user.uid}>{user.displayName || user.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Summary
                </Button>
                 <Button variant="outline" onClick={handleGenerateReport} disabled={isGeneratingReport}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </Button>
                 <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <ProjectChecklistTable
              project={project}
              checklist={checklist}
              roles={roles}
              users={users}
              emailTemplates={emailTemplates}
              onChecklistChange={handleChecklistChange}
              onFileUpload={handleFileUpload}
              onFileDelete={handleFileDelete}
            />
          </main>
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project 
                        <strong> {project.name}</strong> and all associated data, including uploaded files.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isDeleting}
                        onClick={handleDeleteProject}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
         <MissingItemsReportDialog
            isOpen={isReportDialogOpen}
            onOpenChange={setIsReportDialogOpen}
            isLoading={isGeneratingReport}
            reportContent={reportContent}
            projectName={project.name}
        />

        <ProjectSummaryDialog
            isOpen={isSummaryDialogOpen}
            onOpenChange={setIsSummaryDialogOpen}
            isLoading={isGeneratingSummary}
            summaryContent={summaryContent}
            projectName={project.name}
        />
    </>
  );
}
