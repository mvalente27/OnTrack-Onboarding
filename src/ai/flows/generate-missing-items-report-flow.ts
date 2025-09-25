'use server';
/**
 * @fileOverview A Genkit flow for generating a missing items report for a project.
 *
 * - generateMissingItemsReport: A function to analyze a checklist and report on outstanding items.
 */

import { AzureOpenAI } from 'openai';
import { GenerateMissingItemsReportInputSchema, GenerateMissingItemsReportOutputSchema, type GenerateMissingItemsReportInput, type GenerateMissingItemsReportOutput } from '../../lib/types';

export async function generateMissingItemsReport(input: GenerateMissingItemsReportInput): Promise<GenerateMissingItemsReportOutput> {
  return await generateMissingItemsReportAzure(input);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const reportPrompt = `You are an onboarding process analyst. Your task is to generate a concise and professional report of all outstanding items for a project based on its checklist.\n\nThe provided checklist items will have a status of 'pending', 'in_progress', 'completed', or 'waived'.\n\nYour report should only include items that are currently 'pending' or 'in_progress'. Do not include 'completed' or 'waived' items.\n\nProject Name: {{projectName}}\nChecklist Items:\n{{items}}\n\nGenerate a clear, well-formatted report in plain text. Start with a header like \"Missing Items Report for [Project Name]\". If all items are completed or waived, the report should state that there are no outstanding items.`;



async function generateMissingItemsReportAzure(input: GenerateMissingItemsReportInput): Promise<GenerateMissingItemsReportOutput> {
  const outstandingItems = input.items.filter(
    item => item.status === 'pending' || item.status === 'in_progress'
  );
  let checklistText = '';
  if (outstandingItems.length > 0) {
    checklistText = outstandingItems.map(item => `- ${item.label} (Status: ${item.status})`).join('\n');
  }
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const promptText = reportPrompt
    .replace('{{projectName}}', input.projectName)
    .replace('{{items}}', checklistText);
    const messages = [
      { role: 'system', content: 'You are an onboarding process analyst.' } as import('openai/resources/chat/completions/completions').ChatCompletionSystemMessageParam,
      { role: 'user', content: promptText } as import('openai/resources/chat/completions/completions').ChatCompletionUserMessageParam,
    ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 512,
  });
  const content = response.choices?.[0]?.message?.content || '';
  return {
    report: content
  };
}
