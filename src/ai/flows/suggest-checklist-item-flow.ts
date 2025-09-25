
'use server';
/**
 * @fileOverview A Genkit flow for suggesting checklist items for a new template.
 *
 * - suggestChecklistItems: A function to generate a list of checklist items based on a template name.
 */

import { AzureOpenAI } from 'openai';
import { SuggestChecklistItemsInputSchema, SuggestChecklistItemsOutputSchema, type SuggestChecklistItemsInput, type SuggestChecklistItemsOutput } from '../../lib/types';

export async function suggestChecklistItems(input: SuggestChecklistItemsInput): Promise<SuggestChecklistItemsOutput> {
  return await suggestChecklistItemsAzure(input);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const suggestItemsPrompt = `You are an expert onboarding consultant for property management companies. Your task is to suggest a list of checklist items for a new onboarding template based on its name.\n\nThe items should be logical, actionable tasks. For each item, determine the best input type and whether it's likely to require a file upload (e.g., a signed document).\n\nTemplate Name: {{templateName}}\n\nGenerate a list of 5 to 10 relevant checklist items. For 'type', choose from 'text', 'number', 'date', 'checkbox', or 'textarea'. For 'requiresFile', use true if a document like a contract, ID, or form is needed.`;


async function suggestChecklistItemsAzure(input: SuggestChecklistItemsInput): Promise<SuggestChecklistItemsOutput> {
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const promptText = suggestItemsPrompt.replace('{{templateName}}', input.templateName);
  const messages = [
    { role: 'system', content: 'You are an expert onboarding consultant for property management companies.' } as import('openai/resources/chat/completions/completions').ChatCompletionSystemMessageParam,
    { role: 'user', content: promptText } as import('openai/resources/chat/completions/completions').ChatCompletionUserMessageParam,
  ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 512,
  });
  const content = response.choices?.[0]?.message?.content || '';
  // Extraction logic: expects checklist items in a structured format
  // For now, return the raw content as a single item list
  return {
    items: [{ label: content, type: 'text', requiresFile: false }]
  };
}
