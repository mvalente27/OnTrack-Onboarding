'use server';
/**
 * @fileOverview A Genkit flow for suggesting Kanban stages for a business process.
 *
 * - suggestProjectStages: A function to generate a list of stages.
 */

import { AzureOpenAI } from 'openai';
import { SuggestProjectStagesInputSchema, SuggestProjectStagesOutputSchema, type SuggestProjectStagesInput, type SuggestProjectStagesOutput } from '../../lib/types';

export async function suggestProjectStages(input: SuggestProjectStagesInput): Promise<SuggestProjectStagesOutput> {
  return await suggestProjectStagesAzure(input);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const suggestStagesPrompt = `You are an expert business process consultant. Your task is to suggest a concise list of Kanban stages for a given business workflow. The stages should represent the key phases of the process from start to finish.\n\nWorkflow Name: {{projectTypeName}}\n\nGenerate a list of 4 to 7 stages that would be appropriate for a Kanban board to track this workflow. The stage names should be short and clear.`;


async function suggestProjectStagesAzure(input: SuggestProjectStagesInput): Promise<SuggestProjectStagesOutput> {
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const promptText = suggestStagesPrompt.replace('{{projectTypeName}}', input.projectTypeName);
  const messages = [
    { role: 'system', content: 'You are an expert business process consultant.' } as import('openai/resources/chat/completions/completions').ChatCompletionSystemMessageParam,
    { role: 'user', content: promptText } as import('openai/resources/chat/completions/completions').ChatCompletionUserMessageParam,
  ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 256,
  });
  const content = response.choices?.[0]?.message?.content || '';
  // Extraction logic: expects stages in a structured format
  // For now, return the raw content as a single stage
  return {
    stages: [content]
  };
}
