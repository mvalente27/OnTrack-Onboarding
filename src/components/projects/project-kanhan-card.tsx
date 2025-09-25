// src/components/projects/project-kanban-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingTracker } from '@/components/onboarding-tracker';
import type { Project, AppUser } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, User } from 'lucide-react';

interface ProjectKanbanCardProps {
  project: Project;
  usersById: Record<string, AppUser>;
  onDelete: (project: Project) => void;
}

export function ProjectKanbanCard({ project, usersById, onDelete }: ProjectKanbanCardProps) {
  const router = useRouter();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(project);
  };
  
  const assignedUser = project.assignedUserId ? usersById[project.assignedUserId] : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-card group">
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div className="space-y-1">
            <CardTitle className="text-xl">{project.name}</CardTitle>
            {assignedUser && (
                <CardDescription className="flex items-center pt-1 text-xs">
                    <User className="w-3 h-3 mr-1.5" />
                    {assignedUser.displayName || assignedUser.email}
                </CardDescription>
            )}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-6">
        <OnboardingTracker stages={project.stages} />
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/projects/${project.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
