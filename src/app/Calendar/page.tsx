// src/app/calendar/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useAuth } from '../../context/auth-context';
// TODO: Refactor to use Azure services
import type { Lead, Project } from '../../lib/types';
import { getLeadsAzure, getProjectsAzure } from '../../lib/azure/cosmos';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import type { EventSourceInput } from '@fullcalendar/core';

export default function CalendarPage() {
  const { appUser, hasPermission } = useAuth();
  const [events, setEvents] = useState<EventSourceInput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadCalendarData() {
      if (!appUser?.companyId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
  const accessibleProjectTypeIds = hasPermission() ? undefined : appUser.role?.projectTypeIds;

      const [fetchedLeads, fetchedProjects] = await Promise.all([
        await getLeadsAzure(appUser.companyId, accessibleProjectTypeIds),
        await getProjectsAzure(appUser.companyId, accessibleProjectTypeIds)
      ]);

    const leadEvents = fetchedLeads.map((lead: Lead) => ({
      title: `Lead: ${lead.clientName}`,
      date: lead.dealCreationDate,
      id: lead.id,
      extendedProps: { type: 'lead' },
      backgroundColor: 'hsl(var(--accent))',
      borderColor: 'hsl(var(--accent))',
    }));

    const projectEvents = fetchedProjects.map((project: Project) => ({
      title: `Project Started: ${project.name}`,
      date: project.createdAt.toDate().toISOString().split('T')[0], // Convert timestamp to YYYY-MM-DD
      id: project.id,
      extendedProps: { type: 'project' },
      backgroundColor: 'hsl(var(--primary))',
      borderColor: 'hsl(var(--primary))',
    }));

    const taskEvents = fetchedProjects.flatMap((project: Project) => 
      project.checklist
        .filter((item: any) => !!item.dueDate)
        .map((item: any) => ({
          title: `Task Due: ${item.label} (${project.name})`,
          date: item.dueDate,
          id: project.id, // Link to the parent project
          extendedProps: { type: 'project' }, // Clicking a task also goes to the project
          backgroundColor: 'hsl(var(--destructive))',
          borderColor: 'hsl(var(--destructive))',
        }))
    );

    setEvents([...leadEvents, ...projectEvents, ...taskEvents]);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        toast({
          title: 'Error Loading Data',
          description: 'Could not fetch data for the calendar.'
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (appUser) {
      loadCalendarData();
    }
  }, [appUser, hasPermission, toast]);

  const handleEventClick = (clickInfo: any) => {
    const { id, type } = clickInfo.event.extendedProps;
    if (type === 'lead') {
      router.push(`/leads`); // Navigate to leads page, full view has lead info
    } else if (type === 'project') {
      router.push(`/projects/${clickInfo.event.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            A view of all important dates and deadlines.
          </p>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)]">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              height="100%"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              dayMaxEvents={true} // for better mobile view
            />
          </div>
        )}
      </main>
    </div>
  );
}
