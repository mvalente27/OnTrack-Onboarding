// src/components/users/invite-user-dialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createInvitation } from '@/lib/firebase/services/invitations';
import { useAuth } from '@/context/auth-context';

interface InviteUserDialogProps {
  roles: Role[];
  onInviteSent: () => void;
}

export function InviteUserDialog({ roles, onInviteSent }: InviteUserDialogProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendInvite = async () => {
    if (!email.trim() || !roleId) {
      toast({ title: 'Missing Information', description: 'Please provide an email and select a role.', variant: 'destructive' });
      return;
    }
    if (!appUser?.companyId) {
        toast({ title: 'Company not found', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
        await createInvitation(appUser.companyId, email, roleId);
        toast({ title: 'Invitation Sent!', description: `An invitation has been logged for ${email}. They can now sign up.` });
        onInviteSent(); // Refresh user list if needed
        setIsDialogOpen(false);
        setEmail('');
        setRoleId('');
    } catch (error: any) {
        toast({ title: 'Invitation Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Enter the user's email and assign a role. They will be able to sign up after you send the invite.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role</Label>
             <Select value={roleId} onValueChange={setRoleId} disabled={isSubmitting}>
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                    {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSendInvite} disabled={!email || !roleId || isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2" /> Send Invite</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
