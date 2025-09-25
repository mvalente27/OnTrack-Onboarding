// 'use server';
/**
 * @fileOverview A Genkit flow for prioritizing new sales leads.
 *
 * - prioritizeLead: A function to analyze lead data and assign a priority.
 */

import { AzureOpenAI } from 'openai';
import { PrioritizeLeadInputSchema, PrioritizeLeadOutputSchema, type PrioritizeLeadInput, type PrioritizeLeadOutput } from '../../lib/types';



export async function prioritizeLead(input: PrioritizeLeadInput): Promise<PrioritizeLeadOutput> {
  // Ensure unitCount is a number before calling the flow.
  const aipInput = { ...input, unitCount: input.unitCount || 0 };
  return await prioritizeLeadAzure(aipInput);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const priorityPrompt = `You are an expert sales analyst for a property management company. Your task is to prioritize a new sales lead based on the information provided.\n\nThe company prefers leads with a higher number of units. A lead with 50+ units should be considered High priority. A lead with 20-49 units is likely Medium priority. Anything less than 20 units is likely Low priority.\n\nAlso, consider any notes provided. Notes mentioning urgency, multiple properties, or dissatisfaction with a current provider should increase the priority.\n\nAnalyze the following lead information:\nClient Name: {{clientName}}\nUnit Count: {{unitCount}}\nNotes: {{notes}}\n\nAssign a priority of \"High\", \"Medium\", or \"Low\" and provide a brief, one-sentence justification for your choice.`;



async function prioritizeLeadAzure(input: PrioritizeLeadInput): Promise<PrioritizeLeadOutput> {
  if (!input.unitCount && !input.notes) {
    return {
      priority: 'Low',
      justification: 'Not enough information provided to determine priority.'
    };
  }
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const promptText = priorityPrompt
    .replace('{{clientName}}', input.clientName)
    .replace('{{unitCount}}', String(input.unitCount))
    .replace('{{notes}}', input.notes || '');
  const messages = [
    { role: 'system', content: 'You are an expert sales analyst for a property management company.' } as const,
    { role: 'user', content: promptText } as const,
  ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 256,
  });
  const content = response.choices?.[0]?.message?.content || '';
  // Simple extraction logic (should be improved for production)
  const priorityMatch = content.match(/priority\s*[:\-]?\s*(High|Medium|Low)/i);
  const justificationMatch = content.match(/justification\s*[:\-]?\s*(.*)/i);
  return {
    priority: (priorityMatch ? priorityMatch[1] : 'Medium') as 'High' | 'Medium' | 'Low',
    justification: justificationMatch ? justificationMatch[1] : content
  };
}
