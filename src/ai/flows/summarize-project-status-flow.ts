'use server';
/**
 * @fileOverview A Genkit flow for summarizing the status of a project.
 *
 * - summarizeProjectStatus: A function to generate a concise summary of a project's state.
 */

import { AzureOpenAI } from 'openai';
import { SummarizeProjectStatusInputSchema, SummarizeProjectStatusOutputSchema, type SummarizeProjectStatusInput, type SummarizeProjectStatusOutput } from '../../lib/types';

export async function summarizeProjectStatus(input: SummarizeProjectStatusInput): Promise<SummarizeProjectStatusOutput> {
  return await summarizeProjectStatusAzure(input);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const summaryPrompt = `You are an expert project management assistant. Your task is to generate a concise, professional, one-paragraph summary of a project's current status based on the data provided.\n\nThe summary should be easy to read and suitable for a stakeholder update.\n\nAnalyze the following project data:\n- Project Name: {{projectName}}\n- Current Stage: {{currentStage}}\n- Total Checklist Items: {{totalTasks}}\n- Completed Items: {{completedTasks}}\n- In-Progress Items: {{inProgressTasks}}\n- Pending Items: {{pendingTasks}}\n- Overall Project Manager: {{projectManager}}\n- Task Assignees: {{taskAssignees}}\n\nSynthesize this information into a clear status summary. Mention the current stage and the overall progress of tasks. If there are specific people assigned, mention them. If there is a clear project manager, highlight them as the point of contact.`;


async function summarizeProjectStatusAzure(input: SummarizeProjectStatusInput): Promise<SummarizeProjectStatusOutput> {
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const taskAssignees = input.taskAssignees?.join(', ') || '';
  const promptText = summaryPrompt
    .replace('{{projectName}}', input.projectName)
    .replace('{{currentStage}}', input.currentStage)
    .replace('{{totalTasks}}', String(input.totalTasks))
    .replace('{{completedTasks}}', String(input.completedTasks))
    .replace('{{inProgressTasks}}', String(input.inProgressTasks))
    .replace('{{pendingTasks}}', String(input.pendingTasks))
    .replace('{{projectManager}}', input.projectManager || '')
    .replace('{{taskAssignees}}', taskAssignees);
  const messages = [
    { role: 'system', content: 'You are an expert project management assistant.' } as import('openai/resources/chat/completions/completions').ChatCompletionSystemMessageParam,
    { role: 'user', content: promptText } as import('openai/resources/chat/completions/completions').ChatCompletionUserMessageParam,
  ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 256,
  });
  const content = response.choices?.[0]?.message?.content || '';
  return {
    summary: content
  };
}
