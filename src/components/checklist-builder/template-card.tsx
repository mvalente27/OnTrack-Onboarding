// src/components/checklist-builder/template-card.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MoreVertical, Trash2, Edit } from 'lucide-react';
import type { ChecklistTemplate } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateCardProps {
  template: ChecklistTemplate;
  onDelete: (templateId: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(template.id);
  };
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
            <CardTitle className="text-lg font-medium">
                <Link href={`/checklist-builder/${template.id}`} className="hover:underline stretched-link">
                    {template.name}
                </Link>
            </CardTitle>
             <p className="text-sm text-muted-foreground pt-1">
                {template.items.length} {template.items.length === 1 ? 'item' : 'items'}
            </p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/checklist-builder/${template.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow flex items-end">
        
      </CardContent>
    </Card>
  );
}
