// src/components/projects/missing-items-report-dialog.tsx
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

interface MissingItemsReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  reportContent: string;
  projectName: string;
}

export function MissingItemsReportDialog({
  isOpen,
  onOpenChange,
  isLoading,
  reportContent,
  projectName,
}: MissingItemsReportDialogProps) {
    const { toast } = useToast();

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(reportContent);
        toast({ title: 'Copied to Clipboard!', description: 'The report has been copied.' });
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Missing Items Report</DialogTitle>
          <DialogDescription>
            A summary of outstanding items for <strong>{projectName}</strong>.
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
              value={reportContent}
              className="h-96 text-sm font-mono bg-muted"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopyToClipboard} disabled={isLoading || !reportContent}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
