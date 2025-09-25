// src/components/leads/leads-actions.tsx
'use client';

import { useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Mail, Trash2 } from 'lucide-react';
import type { Lead } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateClientEmail } from '@/ai/flows/generate-client-email-flow';

interface LeadsActionsProps {
  lead: Lead;
  isPending: boolean;
  onDelete: (lead: Lead) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function LeadsActions({ lead, isPending, onDelete, canEdit, canDelete }: LeadsActionsProps) {
  const { toast } = useToast();
  const [isEmailPending, startEmailTransition] = useTransition();

  const handleSendFormEmail = (lead: Lead) => {
    startEmailTransition(async () => {
      try {
        const formUrl = `${window.location.origin}/leads/${lead.id}/form`;
        const emailContent = await generateClientEmail({
          clientName: lead.clientName,
          formUrl,
        });

        // In a real app, you would integrate an email service here.
        // For now, we'll show the generated content in a toast.
        toast({
          title: `Subject: ${emailContent.subject}`,
          description: (
            <div className="mt-2 p-2 border rounded-md bg-muted text-muted-foreground whitespace-pre-wrap font-mono text-xs">
              <p>To: {lead.email}</p>
              <br />
              <p>{emailContent.body}</p>
            </div>
          ),
          duration: 15000, // Show for longer so it can be read
        });
      } catch (err) {
        console.error('Failed to generate email: ', err);
        toast({
          title: 'Email Generation Failed',
          description: 'Could not generate the client email.',
          variant: 'destructive',
        });
      }
    });
  };

  const isActionDisabled = isPending || isEmailPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isActionDisabled}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onSelect={() => handleSendFormEmail(lead)}
          disabled={isActionDisabled || !canEdit}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Form to Client
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
        <DropdownMenuItem disabled={!canEdit}>Edit</DropdownMenuItem>
        {canDelete && (
            <DropdownMenuItem 
            className="text-destructive"
            onSelect={() => onDelete(lead)}
            disabled={isActionDisabled}
            >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
