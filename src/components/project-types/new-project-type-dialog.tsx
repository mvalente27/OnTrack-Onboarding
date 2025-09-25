'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { PlusCircle, Loader2, Wand2, Trash2, GripVertical } from 'lucide-react';
import { suggestProjectStages } from '@/ai/flows/suggest-project-stages-flow';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';


interface NewProjectTypeDialogProps {
  onCreateProjectType: (name: string, stages: string[], isSales: boolean) => Promise<void>;
}

export function NewProjectTypeDialog({ onCreateProjectType }: NewProjectTypeDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [stages, setStages] = useState<string[]>([]);
  const [isSales, setIsSales] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggesting, startSuggestionTransition] = useTransition();

  // Debounce suggestion logic
  useEffect(() => {
    if (name.trim().length < 3) {
      setStages([]); // Clear suggestions if name is too short
      return;
    }
    const handler = setTimeout(() => {
      startSuggestionTransition(async () => {
        try {
          const result = await suggestProjectStages({ projectTypeName: name });
          setStages(result.stages);
        } catch (error) {
          console.error("Failed to suggest stages", error);
          toast({ title: "Suggestion Failed", description: "Could not get AI suggestions.", variant: 'destructive' });
        }
      });
    }, 500); // 500ms debounce delay

    return () => clearTimeout(handler);
  }, [name, toast]);
  
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

  const handleCreate = async () => {
    const validStages = stages.map(s => s.trim()).filter(s => s);
    if (name.trim() && validStages.length > 0) {
      setIsCreating(true);
      await onCreateProjectType(name.trim(), validStages, isSales);
      setIsCreating(false);
      setName('');
      setStages([]);
      setIsSales(true);
      setIsDialogOpen(false);
    } else {
        toast({ title: "Missing Information", description: "Please provide a name and at least one stage.", variant: "destructive"})
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          New Project Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project Type</DialogTitle>
          <DialogDescription>
            Define a new workflow. As you type a name, we'll suggest stages with AI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Type Name</Label>
            <Input
              id="name"
              placeholder="e.g. Property Acquisition, Tenant Eviction"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>
           <div className="space-y-2">
            <Label>Workflow Stages</Label>
            {isSuggesting ? (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                </div>
            ) : stages.length > 0 ? (
                <div className="space-y-2">
                   {stages.map((stage, index) => (
                       <div key={index} className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                           <Input value={stage} onChange={(e) => handleStageChange(index, e.target.value)} />
                           <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(index)} className="text-destructive hover:text-destructive">
                               <Trash2 className="h-4 w-4" />
                           </Button>
                       </div>
                   ))}
                </div>
            ) : (
                 <div className="flex items-center justify-center h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Start typing a name to see AI suggestions.</p>
                </div>
            )}
             <Button variant="outline" size="sm" onClick={handleAddStage} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Stage Manually
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-sales"
              checked={isSales}
              onCheckedChange={(checked) => setIsSales(!!checked)}
              disabled={isCreating}
            />
            <Label htmlFor="is-sales" className="font-normal">
              This is a sales-related project type (shows fields like Lead Source).
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isCreating || isSuggesting}>
            {isCreating ? <Loader2 className="animate-spin" /> : 'Create Project Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
