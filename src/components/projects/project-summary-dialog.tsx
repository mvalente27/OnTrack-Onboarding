// src/components/projects/project-summary-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ProjectSummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  summaryContent: string;
  projectName: string;
}

export function ProjectSummaryDialog({
  isOpen,
  onOpenChange,
  isLoading,
  summaryContent,
  projectName,
}: ProjectSummaryDialogProps) {
    const { toast } = useToast();

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(summaryContent);
        toast({ title: 'Copied to Clipboard!', description: 'The summary has been copied.' });
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Project Summary</DialogTitle>
          <DialogDescription>
            A concise, AI-generated overview of <strong>{projectName}</strong>'s current status.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <Textarea
              readOnly
              value={summaryContent}
              className="h-64 text-sm bg-muted"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopyToClipboard} disabled={isLoading || !summaryContent}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
