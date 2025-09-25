// src/components/leads-page.tsx
'use client';

import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, Star, Search } from 'lucide-react';
import type { Lead, LeadStage, ChecklistTemplate, ProjectType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useState, useTransition, useMemo, useCallback } from 'react';
import { getLeads, updateLeadStage, deleteLead, getTemplates, getProjectTypes } from '@/lib/firebase/services';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { LeadsActions } from './leads/leads-actions';
import { HandoffDialog } from './leads/handoff-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PermissionDenied } from './auth/permission-denied';


const stageColors: Record<LeadStage, string> = {
  'Potential Deal': 'bg-gray-500',
  'Data Sheet Submitted': 'bg-blue-500',
  'Meeting Scheduled': 'bg-cyan-500',
  'Need to Send Proposals': 'bg-yellow-500',
  'Proposal Sent': 'bg-orange-500',
  'Contract Sent': 'bg-purple-500',
  'Contract Signed': 'bg-green-600',
  Onboarding: 'bg-teal-500',
  Closed: 'bg-gray-700',
};

const leadStages: LeadStage[] = [
  'Potential Deal',
  'Data Sheet Submitted',
  'Meeting Scheduled',
  'Need to Send Proposals',
  'Proposal Sent',
  'Contract Sent',
  'Contract Signed',
];

const priorities = ['High', 'Medium', 'Low'];

export function LeadsPage() {
  const { appUser, hasPermission, permissions } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // For the handoff dialog
  const [isHandoffDialogOpen, setIsHandoffDialogOpen] = useState(false);
  const [leadForHandoff, setLeadForHandoff] = useState<Lead | null>(null);
  const [onboardingTemplates, setOnboardingTemplates] = useState<ChecklistTemplate[]>([]);

  // For the delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // For filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');


  useEffect(() => {
    async function loadData() {
      if (!appUser?.companyId || !hasPermission('view_leads')) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const accessibleProjectTypeIds = hasPermission('manage_all') ? undefined : appUser.role?.projectTypeIds;

        const [fetchedLeads, fetchedTemplates, fetchedProjectTypes] = await Promise.all([
          getLeads(appUser.companyId, accessibleProjectTypeIds),
          getTemplates(appUser.companyId),
          getProjectTypes(appUser.companyId)
        ]);
        setLeads(fetchedLeads);
        setOnboardingTemplates(fetchedTemplates);
        setProjectTypes(fetchedProjectTypes);

      } catch (error) {
        console.error('Failed to fetch data', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch your leads or templates.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (appUser?.companyId) {
      loadData();
    }
  }, [toast, hasPermission, appUser]);

  const handleStageChange = (lead: Lead, newStage: LeadStage) => {
    if (newStage === 'Contract Signed') {
      setLeadForHandoff(lead);
      setIsHandoffDialogOpen(true);
      return;
    }

    startTransition(async () => {
      try {
        await updateLeadStage(lead.id, newStage);
        setLeads(prevLeads =>
          prevLeads.map(l => (l.id === lead.id ? { ...l, stage: newStage } : l))
        );
        toast({
          title: 'Stage Updated',
          description: `Lead "${lead.clientName}" moved to ${newStage}.`,
        });
      } catch (error) {
        console.error('Failed to update stage', error);
        toast({
          title: 'Error Updating Stage',
          variant: 'destructive',
        });
      }
    });
  };

  const handleHandoffComplete = useCallback((convertedLeadId: string) => {
     setLeads(prevLeads =>
        prevLeads.map(l => (l.id === convertedLeadId ? { ...l, stage: 'Onboarding' } : l))
      );
     setLeadForHandoff(null);
  }, []);
  
  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    setIsDeleting(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
      toast({
        title: 'Lead Deleted',
        description: `Successfully deleted lead for "${leadToDelete.clientName}".`,
      });
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Could not delete the lead.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };
  
  const getProjectTypeName = (projectTypeId?: string) => {
      if (!projectTypeId) return 'N/A';
      return projectTypes.find(pt => pt.id === projectTypeId)?.name || 'Unknown';
  }


  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const searchMatch = lead.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const stageMatch = stageFilter === 'all' || lead.stage === stageFilter;
      const priorityMatch = priorityFilter === 'all' || lead.priority === priorityFilter;
      return searchMatch && stageMatch && priorityMatch;
    });
  }, [leads, searchQuery, stageFilter, priorityFilter]);

  if (isLoading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
  }
  if (!hasPermission('view_leads')) {
      return <PermissionDenied />
  }


  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">Lead Tracking</h1>
            <p className="text-muted-foreground">
              Manage your potential deals from inquiry to close.
            </p>
          </div>
          {hasPermission('edit_leads') && (
            <Button asChild>
                <Link href="/leads/new">
                <PlusCircle />
                New Lead
                </Link>
            </Button>
          )}
        </header>
        <div className="flex items-center gap-4 p-4 sm:p-6 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by client name..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by stage..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {leadStages.map(stage => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
               <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Card className="border-0 rounded-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <h2 className="text-xl font-medium text-muted-foreground">
                      You have no leads yet
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Click "New Lead" to add your first potential deal.
                    </p>
                    {hasPermission('edit_leads') && (
                      <Button asChild>
                        <Link href="/leads/new">
                          <PlusCircle />
                          New Lead
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <h2 className="text-xl font-medium text-muted-foreground">
                      No leads found
                    </h2>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-4"></TableHead>
                        <TableHead className="w-[200px]">Client Name</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Lead Source</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                          <TableRow key={lead.id} className={cn(isPending && 'opacity-50')}>
                            <TableCell>
                              {lead.priority && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant={
                                        lead.priority === 'High' ? 'destructive' : lead.priority === 'Medium' ? 'secondary' : 'outline'
                                      }
                                      className="cursor-default"
                                    >
                                      {lead.priority}
                                    </Badge>
                                  </TooltipTrigger>
                                  {lead.priorityJustification && (
                                    <TooltipContent>
                                      <p>{lead.priorityJustification}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {lead.clientName}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{getProjectTypeName(lead.projectTypeId)}</Badge>
                            </TableCell>
                            <TableCell>
                              {lead.stage === 'Onboarding' || lead.stage === 'Closed' ? (
                                <Badge
                                  variant="secondary"
                                  className={cn('text-white', stageColors[lead.stage])}
                                >
                                  {lead.stage}
                                </Badge>
                              ) : (
                                <Select
                                  value={lead.stage}
                                  onValueChange={(newStage: LeadStage) => handleStageChange(lead, newStage)}
                                  disabled={isPending || !hasPermission('edit_leads')}
                                >
                                  <SelectTrigger className="w-[200px] text-xs">
                                    <SelectValue>
                                      <Badge
                                        variant="secondary"
                                        className={cn('text-white', stageColors[lead.stage])}
                                      >
                                        {lead.stage}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {leadStages.map(stage => (
                                      <SelectItem key={stage} value={stage}>
                                        {stage}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.leadSource || 'N/A'}</TableCell>
                            <TableCell>{lead.unitCount || 'N/A'}</TableCell>
                            <TableCell>
                              {lead.dealCreationDate
                                ? format(new Date(lead.dealCreationDate), 'PP')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <LeadsActions 
                                lead={lead} 
                                isPending={isPending} 
                                onDelete={openDeleteDialog} 
                                canDelete={hasPermission('delete_leads')}
                                canEdit={hasPermission('edit_leads')}
                              />
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

        {/* Handoff Dialog */}
        {leadForHandoff && (
          <HandoffDialog
              lead={leadForHandoff}
              templates={onboardingTemplates.filter(t => t.projectTypeId === leadForHandoff.projectTypeId)}
              isOpen={isHandoffDialogOpen}
              onOpenChange={setIsHandoffDialogOpen}
              onHandoffComplete={handleHandoffComplete}
          />
        )}
      

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the lead for 
                <strong> {leadToDelete?.clientName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleDeleteLead}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
