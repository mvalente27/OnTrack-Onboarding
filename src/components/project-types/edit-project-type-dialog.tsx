// src/components/project-types/edit-project-type-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProjectType } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';

interface EditProjectTypeDialogProps {
  projectType: ProjectType;
  onUpdateProjectType: (id: string, name: string, stages: string[], isSales: boolean) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectTypeDialog({ 
    projectType, 
    onUpdateProjectType,
    isOpen,
    onOpenChange
}: EditProjectTypeDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(projectType.name);
  const [stages, setStages] = useState(projectType.stages);
  const [isSales, setIsSales] = useState(projectType.isSales);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Reset state if a different project type is passed in
    setName(projectType.name);
    setStages(projectType.stages);
    setIsSales(projectType.isSales);
  }, [projectType]);

  const handleStageChange = (index: number, value: string) => {
    const newStages = [...stages];
    newStages[index] = value;
    setStages(newStages);
  };
  
  const handleAddStage = () => {
    setStages([...stages, 'New Stage']);
  }
  
  const handleDeleteStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  }

  const handleSave = async () => {
    const validStages = stages.map(s => s.trim()).filter(s => s);
    if (name.trim() && validStages.length > 0) {
      setIsSaving(true);
      await onUpdateProjectType(projectType.id, name.trim(), validStages, isSales);
      setIsSaving(false);
      onOpenChange(false);
    } else {
        toast({ title: "Missing Information", description: "Please provide a name and at least one stage.", variant: "destructive"})
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project Type</DialogTitle>
          <DialogDescription>
            Update the name and workflow stages for this project type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Type Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>Workflow Stages</Label>
             <div className="space-y-2">
               {stages.map((stage, index) => (
                   <div key={index} className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                       <Input value={stage} onChange={(e) => handleStageChange(index, e.target.value)} />
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(index)} className="text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                       </Button>
                   </div>
               ))}
            </div>
             <Button variant="outline" size="sm" onClick={handleAddStage} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Stage
            </Button>
          </div>
           <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-is-sales"
              checked={isSales}
              onCheckedChange={(checked) => setIsSales(!!checked)}
              disabled={isSaving}
            />
            <Label htmlFor="edit-is-sales" className="font-normal">
              This is a sales-related project type (shows fields like Lead Source).
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
