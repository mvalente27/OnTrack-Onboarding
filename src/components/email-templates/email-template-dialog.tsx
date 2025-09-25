// src/components/email-templates/email-template-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { ProjectType, EmailTemplate } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

type EmailTemplateData = Omit<EmailTemplate, 'id' | 'companyId' | 'createdAt'>;

interface NewEmailTemplateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: EmailTemplateData, id?: string) => Promise<boolean>;
    projectTypes: ProjectType[];
    isSubmitting: boolean;
    template?: EmailTemplate | null;
    triggerButtonText: string;
    canEdit: boolean;
}

export function NewEmailTemplateDialog({ 
    isOpen,
    onOpenChange,
    onSave,
    projectTypes,
    isSubmitting,
    template,
    triggerButtonText,
    canEdit
}: NewEmailTemplateDialogProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [stageName, setStageName] = useState('');

  useEffect(() => {
    if (template) {
        setName(template.name);
        setSubject(template.subject);
        setBody(template.body);
        setProjectTypeId(template.projectTypeId);
        setStageName(template.stageName);
    } else {
        // Reset form when creating a new one
        setName('');
        setSubject('');
        setBody('');
        setProjectTypeId('');
        setStageName('');
    }
  }, [template, isOpen]); // Rerun when template changes or dialog opens

  const availableStages = useMemo(() => {
    const selectedType = projectTypes.find(pt => pt.id === projectTypeId);
    return selectedType?.stages || [];
  }, [projectTypeId, projectTypes]);

  // If the previously selected stage is not in the new list of available stages, reset it.
  useEffect(() => {
    if (stageName && !availableStages.includes(stageName)) {
      setStageName('');
    }
  }, [availableStages, stageName]);


  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !projectTypeId || !stageName) {
        toast({ title: 'Missing Information', description: 'Please fill out all required fields.', variant: 'destructive' });
        return;
    }
    
    const data: EmailTemplateData = { name, subject, body, projectTypeId, stageName };
    const success = await onSave(data, template?.id);
    if (success) {
        onOpenChange(false);
    }
  };
  
  const dialogTitle = template ? 'Edit Email Template' : 'Create New Email Template';
  const dialogDescription = 'Design an email that can be reused for specific stages in your workflows.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        { triggerButtonText && (
            <Button onClick={() => onOpenChange(true)} disabled={!canEdit}>
                <PlusCircle />
                {triggerButtonText}
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Email, Document Request" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <Label htmlFor="project-type">Project Type</Label>
                    <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                        <SelectTrigger id="project-type">
                            <SelectValue placeholder="Select a project type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {projectTypes.map(pt => (
                                <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className='space-y-2'>
                    <Label htmlFor="stage-name">Workflow Stage</Label>
                    <Select value={stageName} onValueChange={setStageName} disabled={!projectTypeId}>
                        <SelectTrigger id="stage-name">
                            <SelectValue placeholder="Select a stage..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStages.map(stage => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input id="template-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line for the email" />
            </div>

             <div className="space-y-2">
                <Label htmlFor="template-body">Email Body</Label>
                <Textarea id="template-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email content here. You can use placeholders like {{clientName}} in the future." rows={10} />
            </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
