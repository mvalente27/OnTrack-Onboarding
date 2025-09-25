// src/components/users-page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import type { AppUser, Role } from '@/lib/types';
import { getUsers, getRoles, updateUserRole, deleteUserAndAccount } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { InviteUserDialog } from './users/invite-user-dialog';

export function UsersPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();

  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const fetchData = async () => {
    if (!appUser?.companyId) return; // Wait for companyId
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        getUsers(appUser.companyId),
        getRoles(appUser.companyId)
      ]);
      
      // Populate role name on each user for easy display
      const usersWithRoles = fetchedUsers.map(user => ({
          ...user,
          role: fetchedRoles.find(role => role.id === user.roleId)
      }))

      setUsers(usersWithRoles);
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast({
        title: 'Error Loading Data',
        description: 'Could not fetch users and roles.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appUser]);

  const handleRoleChange = (userId: string, roleId: string) => {
    startUpdateTransition(async () => {
      try {
        await updateUserRole(userId, roleId);
        toast({
          title: 'Role Updated!',
          description: "The user's role has been successfully changed.",
        });
        // Refetch to get the updated role name displayed correctly
        fetchData();
      } catch (error) {
        console.error('Failed to update role', error);
        toast({
          title: 'Update Failed',
          description: 'There was a problem updating the user role.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleDeleteUser = async () => {
      if (!userToDelete) return;
      setIsDeleting(true);
      try {
          // This function needs to be a Cloud Function in a real app
          // For now, we simulate the deletion of Firestore doc and ask user to delete from Auth console
          await deleteUserAndAccount(userToDelete.uid);
           toast({
            title: 'User Deleted from Firestore',
            description: `Successfully deleted ${userToDelete.email}. Please remove them from the Firebase Authentication console.`,
            duration: 10000,
          });
          setUsers(users.filter(user => user.uid !== userToDelete.uid));
          setUserToDelete(null);

      } catch (error) {
          console.error("Failed to delete user", error);
          toast({ title: "Deletion Failed", description: "Could not delete the user.", variant: "destructive" });
      } finally {
          setIsDeleting(false);
      }
  }


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Invite and assign roles to users to control access.
          </p>
        </div>
        <InviteUserDialog roles={roles} onInviteSent={fetchData} />
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h2 className="text-xl font-medium text-muted-foreground">
                    No users found.
                  </h2>
                   <p className="text-muted-foreground">
                    Click "Invite User" to add team members.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">
                          {user.displayName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.roleId || 'none'}
                            onValueChange={(roleId) => handleRoleChange(user.uid, roleId)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Assign a role..." >
                                {user.role ? <Badge variant="secondary">{user.role.name}</Badge> : 'No Role'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Role</SelectItem>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
        open={!!userToDelete}
        onOpenChange={open => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user record for <strong>{userToDelete?.email}</strong> from the application database. For full deletion, you must also remove the user from the Firebase Authentication console.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
