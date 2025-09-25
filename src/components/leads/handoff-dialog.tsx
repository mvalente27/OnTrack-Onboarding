// src/components/leads/handoff-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Lead, ChecklistTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { convertLeadToProject } from '@/lib/firebase/services';

interface HandoffDialogProps {
  lead: Lead;
  templates: ChecklistTemplate[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onHandoffComplete: (leadId: string) => void;
}

export function HandoffDialog({
  lead,
  templates,
  isOpen,
  onOpenChange,
  onHandoffComplete,
}: HandoffDialogProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
      // If there's only one template, auto-select it.
      if (templates.length === 1) {
          setSelectedTemplateId(templates[0].id);
      }
  }, [templates]);

  const handleConfirmHandoff = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Missing Selection',
        description: 'Please select an onboarding template.',
        variant: 'destructive',
      });
      return;
    }
    setIsConverting(true);
    try {
      await convertLeadToProject(lead.id);
      toast({
        title: 'Handoff Complete!',
        description: `${lead.clientName} is now a project and has been moved to the pipeline.`,
      });
      onHandoffComplete(lead.id); // Notify parent component
      onOpenChange(false); // Close the dialog
    } catch (error: any) {
      console.error('Failed to convert lead to project', error);
      toast({
        title: 'Handoff Failed',
        description: error.message || 'Could not convert lead to project.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Reset local state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTemplateId('');
      setIsConverting(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Project Handoff</DialogTitle>
          <DialogDescription>
            Confirming will create a new project for {' '}
            <strong>{lead.clientName}</strong> using its linked checklist template. This will move the lead to the "Onboarding" stage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">The following template will be used:</p>
          <p className="font-medium">{templates.find(t => t.id === lead.templateId)?.name || 'Linked Template'}</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmHandoff}
            disabled={isConverting || !lead.templateId}
          >
            {isConverting ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Confirm Handoff'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
