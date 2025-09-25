// src/components/projects/send-email-dialog.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { EmailTemplate, Project } from '@/lib/types';
import { Mail, Send } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

interface SendEmailDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    template: EmailTemplate;
    project: Project;
}

export function SendEmailDialog({ 
    isOpen,
    onOpenChange,
    template,
    project,
}: SendEmailDialogProps) {
  const { toast } = useToast();

  const populatedBody = useMemo(() => {
    // Replace placeholders like {{projectName}} with actual project data
    return template.body.replace(/{{projectName}}/g, project.name);
  }, [template.body, project.name]);

  const handleSendEmail = () => {
    // In a real app, this would integrate with an email service (e.g., SendGrid, Mailgun)
    // For now, we'll just show a success toast.
    toast({
        title: 'Email Sent!',
        description: `The email "${template.subject}" has been sent to ${project.email}.`
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Send Email to Client</DialogTitle>
          <DialogDescription>
            Preview and send the email based on the "{template.name}" template.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to" className="text-right">To</Label>
                <Input id="to" value={project.email} readOnly className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Subject</Label>
                <Input id="subject" value={template.subject} readOnly className="col-span-3"/>
            </div>
             <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" value={populatedBody} readOnly rows={12} className="bg-muted"/>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSendEmail}>
            <Send className="mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
