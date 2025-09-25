import {
  FileSignature,
  ClipboardList,
  ClipboardCheck,
  Users,
  Mail,
  Rocket,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { OnboardingStage, OnboardingStatus } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

const stageIcons: Record<string, React.ReactNode> = {
  'Contract Signed': <FileSignature className="w-5 h-5" />,
  'First Priority': <ClipboardList className="w-5 h-5" />,
  'Second Priority': <ClipboardCheck className="w-5 h-5" />,
  '30-15 Days': <Users className="w-5 h-5" />,
  '15-Start': <Mail className="w-5 h-5" />,
  'Start Date': <Rocket className="w-5 h-5" />,
  'Final Accounting': <FileText className="w-5 h-5" />,
};

const statusStyles: Record<
  OnboardingStatus,
  { ring: string; icon: string; text: string }
> = {
  completed: {
    ring: 'ring-primary',
    icon: 'bg-primary text-primary-foreground',
    text: 'text-primary',
  },
  in_progress: {
    ring: 'ring-accent',
    icon: 'bg-accent text-accent-foreground',
    text: 'text-accent',
  },
  pending: {
    ring: 'ring-border',
    icon: 'bg-muted text-muted-foreground',
    text: 'text-muted-foreground',
  },
};

export function OnboardingTracker({ stages }: { stages: OnboardingStage[] }) {
  const completedStagesCount = stages.filter(
    s => s.status === 'completed'
  ).length;
  const progress = (completedStagesCount / stages.length) * 100;
  const currentStage =
    stages.find(s => s.status === 'in_progress') ||
    stages.find(s => s.status === 'pending') ||
    stages[stages.length - 1];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full space-y-6">
        <div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm font-medium">{currentStage.name}</p>
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ring-2 ring-offset-2 ring-offset-card',
                      statusStyles[stage.status].ring,
                      statusStyles[stage.status].icon,
                      stage.status === 'in_progress' && 'animate-pulse'
                    )}
                  >
                    {stageIcons[stage.name]}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p
                    className={cn('font-medium', statusStyles[stage.status].text)}
                  >
                    {stage.name}
                  </p>
                </TooltipContent>
              </Tooltip>
              {index < stages.length - 1 && (
                <div className="flex-1 h-0.5 bg-border mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
