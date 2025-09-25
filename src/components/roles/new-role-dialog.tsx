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
import { PlusCircle, Loader2 } from 'lucide-react';

interface NewRoleDialogProps {
  onCreateRole: (name: string) => Promise<void>;
}

export function NewRoleDialog({ onCreateRole }: NewRoleDialogProps) {
  const [newRoleName, setNewRoleName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (newRoleName.trim()) {
      setIsCreating(true);
      await onCreateRole(newRoleName.trim());
      setIsCreating(false);
      setNewRoleName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          New Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Role</DialogTitle>
          <DialogDescription>
            Give your new role a name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Accountant, Project Manager"
              className="col-span-3"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreate()}
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!newRoleName.trim() || isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
