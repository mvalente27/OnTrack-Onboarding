// src/app/roles/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, Loader2, Trash2, Edit } from 'lucide-react';
import type { Role } from '@/lib/types';
import { createRole, deleteRole, getRoles } from '@/lib/firebase/services/roles';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewRoleDialog } from '@/components/roles/new-role-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';

export default function RolesPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const { toast } = useToast();

  const fetchRoles = async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      let fetchedRoles = await getRoles(appUser.companyId);
      if (fetchedRoles.length === 0) {
        toast({ title: 'No roles found.', description: 'Creating a default Admin role for you.' });
        const adminRoleId = await createRole(appUser.companyId, 'Admin', ['manage_all']);
        const adminRole = await getRoles(appUser.companyId);
        fetchedRoles = adminRole;
      }
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Failed to fetch roles', error);
      toast({
        title: 'Error Loading Roles',
        description: 'Could not fetch your company roles.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appUser) {
      fetchRoles();
    }
  }, [appUser]);

  const handleCreateRole = async (name: string) => {
    if (!appUser) return;
    try {
      await createRole(appUser.companyId, name, []); // Create with no permissions initially
      toast({
        title: 'Role Created!',
        description: `Successfully created the "${name}" role.`,
      });
      fetchRoles(); // Refresh the list
    } catch (error) {
      console.error('Failed to create role', error);
      toast({
        title: 'Error Creating Role',
        description: 'There was a problem creating the role.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      toast({
        title: 'Role Deleted',
        description: `Successfully deleted the "${roleToDelete.name}" role.`,
      });
      setRoles(roles.filter(role => role.id !== roleToDelete.id));
      setRoleToDelete(null);
    } catch (error) {
      console.error('Failed to delete role', error);
      toast({
        title: 'Error Deleting Role',
        description: 'There was a problem deleting the role.',
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
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Define roles and assign permissions for platform access control.
          </p>
        </div>
        <NewRoleDialog onCreateRole={handleCreateRole} />
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h2 className="text-xl font-medium text-muted-foreground">
                    No roles yet
                  </h2>
                  <p className="text-muted-foreground">
                    Click "New Role" to get started.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions[0] === 'manage_all' ? (
                                <Badge variant="default">Full Access</Badge>
                              ) : (
                                role.permissions.slice(0, 5).map(p => <Badge variant="secondary" key={p}>{p.replace(/_/g, ' ')}</Badge>)
                              )
                            ) : (
                                <span className="text-muted-foreground text-sm">No permissions</span>
                            )}
                            {role.permissions && role.permissions.length > 5 && <Badge variant="outline">...</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                               <DropdownMenuItem onClick={() => router.push(`/roles/${role.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setRoleToDelete(role)}
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
        open={!!roleToDelete}
        onOpenChange={open => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <strong> "{roleToDelete?.name}" </strong>
              role. Users assigned to this role will lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteRole}
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
