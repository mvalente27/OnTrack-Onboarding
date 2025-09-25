// src/components/lead-sources/new-lead-source-dialog.tsx
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

interface NewLeadSourceDialogProps {
  onCreateLeadSource: (name: string) => Promise<void>;
}

export function NewLeadSourceDialog({ onCreateLeadSource }: NewLeadSourceDialogProps) {
  const [newLeadSourceName, setNewLeadSourceName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (newLeadSourceName.trim()) {
      setIsCreating(true);
      await onCreateLeadSource(newLeadSourceName.trim());
      setIsCreating(false);
      setNewLeadSourceName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          New Lead Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Lead Source</DialogTitle>
          <DialogDescription>
            Add a new marketing channel or source for your leads.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Website, Referral"
              className="col-span-3"
              value={newLeadSourceName}
              onChange={(e) => setNewLeadSourceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreate()}
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!newLeadSourceName.trim() || isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : 'Create Lead Source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
