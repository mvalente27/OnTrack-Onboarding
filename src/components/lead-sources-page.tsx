// src/components/lead-sources-page.tsx
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
import { MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import type { LeadSource } from '@/lib/types';
import { createLeadSource, deleteLeadSource, getLeadSources } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewLeadSourceDialog } from './lead-sources/new-lead-source-dialog';
import { useAuth } from '@/context/auth-context';

export function LeadSourcesPage() {
  const { appUser } = useAuth();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<LeadSource | null>(null);
  const { toast } = useToast();

  const fetchLeadSources = async () => {
    if (!appUser?.companyId) return; // Wait for companyId
    setIsLoading(true);
    try {
      let fetchedSources = await getLeadSources(appUser.companyId);
      
      if (fetchedSources.length === 0) {
        toast({ title: 'No lead sources found.', description: 'Creating default sources for you.' });
        // Defaults are now created on sign up
      }
      setLeadSources(fetchedSources);
    } catch (error) {
      console.error('Failed to fetch lead sources', error);
      toast({
        title: 'Error Loading Lead Sources',
        description: 'Could not fetch your lead sources.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadSources();
  }, [appUser]);

  const handleCreateLeadSource = async (name: string) => {
    if (!appUser?.companyId) return;
    try {
      await createLeadSource(appUser.companyId, name);
      toast({
        title: 'Lead Source Created!',
        description: `Successfully created "${name}".`,
      });
      fetchLeadSources(); // Refresh the list
    } catch (error) {
      console.error('Failed to create lead source', error);
      toast({
        title: 'Error Creating Lead Source',
        description: 'There was a problem creating the new source.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLeadSource = async () => {
    if (!sourceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLeadSource(sourceToDelete.id);
      toast({
        title: 'Lead Source Deleted',
        description: `Successfully deleted the "${sourceToDelete.name}" source.`,
      });
      setLeadSources(leadSources.filter(source => source.id !== sourceToDelete.id));
      setSourceToDelete(null);
    } catch (error) {
      console.error('Failed to delete lead source', error);
      toast({
        title: 'Error Deleting Lead Source',
        description: 'There was a problem deleting the source.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Lead Source Management</h1>
          <p className="text-muted-foreground">
            Manage your marketing channels and lead origins.
          </p>
        </div>
        <NewLeadSourceDialog onCreateLeadSource={handleCreateLeadSource} />
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : leadSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h2 className="text-xl font-medium text-muted-foreground">
                    No lead sources yet
                  </h2>
                  <p className="text-muted-foreground">
                    Click "New Lead Source" to get started.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Name</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSources.map(source => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">
                          {source.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setSourceToDelete(source)}
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
        open={!!sourceToDelete}
        onOpenChange={open => !open && setSourceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <strong> "{sourceToDelete?.name}" </strong>
              lead source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteLeadSource}
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
