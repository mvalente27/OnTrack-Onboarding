// src/components/projects/project-checklist-table.tsx
'use client';
import { useState, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ProjectChecklistItem, Role, OnboardingStatus, EmailTemplate, Project, AppUser } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Upload, Trash2, File, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { SendEmailDialog } from './send-email-dialog';

interface ProjectChecklistTableProps {
  project: Project;
  checklist: ProjectChecklistItem[];
  roles: Role[];
  users: AppUser[];
  emailTemplates: EmailTemplate[];
  onChecklistChange: (
    itemId: string,
    field: keyof ProjectChecklistItem,
    value: any
  ) => void;
  onFileUpload: (itemId: string, file: File) => Promise<void>;
  onFileDelete: (itemId: string) => Promise<void>;
}

const statusOptions: OnboardingStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'waived',
];

const statusColors: Record<OnboardingStatus, string> = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-600',
  waived: 'bg-yellow-500',
};

// A component to handle the file upload UI for a single checklist item
function FileUploadCell({
  item,
  onFileUpload,
  onFileDelete,
}: {
  item: ProjectChecklistItem;
  onFileUpload: (itemId: string, file: File) => Promise<void>;
  onFileDelete: (itemId: string) => Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await onFileUpload(item.id, file);
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleDelete = async () => {
    setIsUploading(true); // Reuse loading state for deletion
    await onFileDelete(item.id);
    setIsUploading(false);
  }

  if (isUploading) {
    return <Loader2 className="h-5 w-5 animate-spin" />;
  }

  if (item.fileUrl) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
             <File className="h-4 w-4" />
            <span>{item.fileName || 'View File'}</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="outline" size="sm" onClick={triggerFileInput}>
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>
    </>
  );
}


export function ProjectChecklistTable({
  project,
  checklist,
  roles,
  users,
  emailTemplates,
  onChecklistChange,
  onFileUpload,
  onFileDelete,
}: ProjectChecklistTableProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned User</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>File</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checklist.map(item => {
           const relevantTemplate = emailTemplates.find(t => t.stageName === item.stageName);
           return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell>
                  <Select
                    value={item.status}
                    onValueChange={(value: OnboardingStatus) =>
                      onChecklistChange(item.id, 'status', value)
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        <Badge className={cn('text-white', statusColors[item.status])}>
                            {item.status.replace('_', ' ')}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={item.assignedUserId || 'unassigned'}
                    onValueChange={(value: string) =>
                      onChecklistChange(item.id, 'assignedUserId',  value === 'unassigned' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.displayName || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                 <TableCell>
                  <Input
                    type="date"
                    value={item.dueDate || ''}
                    onChange={(e) =>
                      onChecklistChange(item.id, 'dueDate', e.target.value)
                    }
                    className="w-[150px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="Add a note..."
                    value={item.notes || ''}
                    onChange={e =>
                      onChecklistChange(item.id, 'notes', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  {item.requiresFile ? (
                    <FileUploadCell 
                      item={item}
                      onFileUpload={onFileUpload}
                      onFileDelete={onFileDelete}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Not required</span>
                  )}
                </TableCell>
                <TableCell>
                    {relevantTemplate && (
                       <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(relevantTemplate)}>
                           <Mail className="h-4 w-4 mr-2" />
                           Email Client
                       </Button>
                    )}
                </TableCell>
              </TableRow>
           )
        })}
      </TableBody>
    </Table>
    
    {selectedTemplate && (
        <SendEmailDialog
            isOpen={!!selectedTemplate}
            onOpenChange={() => setSelectedTemplate(null)}
            template={selectedTemplate}
            project={project}
        />
    )}
    </>
  );
}
