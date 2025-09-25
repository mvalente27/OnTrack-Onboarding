'use server';
/**
 * @fileOverview A Genkit flow for generating a client-facing email.
 *
 * - generateClientEmail: A function to compose an email to a client.
 */

import { AzureOpenAI } from 'openai';
import { GenerateClientEmailInputSchema, GenerateClientEmailOutputSchema, type GenerateClientEmailInput, type GenerateClientEmailOutput } from '../../lib/types';


export async function generateClientEmail(input: GenerateClientEmailInput): Promise<GenerateClientEmailOutput> {
  return await generateClientEmailAzure(input);
}


const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

const emailPrompt = `You are an onboarding assistant for a property management company. Your task is to generate a professional and friendly email to a new client.\n\nThe goal is to ask them to fill out a data form.\n\nClient Name: {{clientName}}\nForm URL: {{formUrl}}\n\nGenerate a subject and a body for the email. The tone should be welcoming and clear. Make sure to include the form URL in the body of the email.\nAddress the client by their name.\nSign off from \"The OnTrack Onboarding Team\".`;



async function generateClientEmailAzure(input: GenerateClientEmailInput): Promise<GenerateClientEmailOutput> {
  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-12-01-preview',
  });
  const promptText = emailPrompt
    .replace('{{clientName}}', input.clientName)
    .replace('{{formUrl}}', input.formUrl);
    const messages = [
      { role: 'system', content: 'You are an onboarding assistant for a property management company.' } as const,
      { role: 'user', content: promptText } as const,
    ];
  const response = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    max_tokens: 256,
  });
  const content = response.choices?.[0]?.message?.content || '';
  // Simple extraction logic: expects subject and body separated by a delimiter
  const subjectMatch = content.match(/Subject\s*[:\-]?\s*(.*)/i);
  const bodyMatch = content.match(/Body\s*[:\-]?\s*([\s\S]*)/i);
  return {
    subject: subjectMatch ? subjectMatch[1] : 'Welcome to OnTrack!',
    body: bodyMatch ? bodyMatch[1] : content
  };
}
