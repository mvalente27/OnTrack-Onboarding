// src/lib/onboarding.ts
import type { Project, ProjectChecklistItem, OnboardingStage } from './types';
// Removed legacy Firebase import

export const getCurrentStageName = (project: Project): string => {
    if (!project.stages || project.stages.length === 0) {
        return 'Unknown';
    }

    const inProgressStage = project.stages.find(s => s.status === 'in_progress');
    if (inProgressStage) return inProgressStage.name;

    // Find first pending stage if no stage is in progress
    const pendingStage = project.stages.find(s => s.status === 'pending');
    if (pendingStage) return pendingStage.name;

    // If all are completed, show in the final stage
    if (project.stages.every(s => s.status === 'completed')) {
        return project.stages[project.stages.length - 1].name;
    }
    
    // Default fallback if stages are somehow empty or in a weird state
    return project.stages[0].name;
}

const getCurrentStageIndex = (stages: OnboardingStage[]): number => {
    // Find the first stage that is 'in_progress'
    let index = stages.findIndex(s => s.status === 'in_progress');
    
    // If no stage is in progress, find the first 'pending' stage
    if (index === -1) {
        index = stages.findIndex(s => s.status === 'pending');
    }
    
    return index;
};


/**
 * Checks if a project's current stage is complete and advances them to the next stage if so.
 * @param project The project object.
 * @param checklist The project's full checklist.
 * @param onStageAdvanced A callback function to be executed when the stage is successfully advanced.
 */
export async function checkAndAdvanceStage(
    project: Project,
    checklist: ProjectChecklistItem[],
    onStageAdvanced: (newStages: OnboardingStage[]) => void
): Promise<void> {
    const currentStageIndex = getCurrentStageIndex(project.stages);
    
    // Check if project is at the last stage or if all stages are already completed
    if (currentStageIndex === -1 || currentStageIndex === project.stages.length - 1) {
        return;
    }

    const currentStage = project.stages[currentStageIndex];
    const itemsForCurrentStage = checklist.filter(item => item.stageName === currentStage.name);

    // If there are no items required for this stage, we can advance immediately.
    // If there are items, we check if they are all completed.
    const allTasksInStageCompleted = itemsForCurrentStage.length === 0 || itemsForCurrentStage.every(item => item.status === 'completed' || item.status === 'waived');


    if (allTasksInStageCompleted) {
        const newStages = [...project.stages];
        newStages[currentStageIndex] = { ...newStages[currentStageIndex], status: 'completed' };
        
        const nextStageIndex = currentStageIndex + 1;
        if (nextStageIndex < newStages.length) {
            newStages[nextStageIndex] = { ...newStages[nextStageIndex], status: 'in_progress' };
        }

        // Azure Cosmos DB update for project stages
        try {
            const { updateProjectStagesAzure } = await import('./azure/cosmos');
            await updateProjectStagesAzure(project.id, newStages);
            onStageAdvanced(newStages);
        } catch (error) {
            console.error('Failed to update project stages in Azure Cosmos DB:', error);
        }
    }
}
