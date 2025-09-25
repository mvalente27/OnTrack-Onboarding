// src/lib/firebase/services/templates.ts
import { cosmosClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistTemplate, ChecklistItem } from '../../types';
const TEMPLATES_CONTAINER = 'templates';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';

export async function createTemplate(companyId: string, name: string): Promise<string> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const item: ChecklistTemplate = {
    id,
    companyId,
    name,
    items: [],
    createdAt,
    projectTypeId: '',
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(TEMPLATES_CONTAINER);
  await container.items.create(item);
  return id;
}

export async function getTemplates(companyId: string): Promise<ChecklistTemplate[]> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(TEMPLATES_CONTAINER);
  const query = 'SELECT * FROM c WHERE c.companyId = @companyId';
  const parameters = [{ name: '@companyId', value: companyId }];
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  return resources as ChecklistTemplate[];
}

export async function getTemplate(templateId: string): Promise<ChecklistTemplate | null> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(TEMPLATES_CONTAINER);
  const { resource } = await container.item(templateId, templateId).read<ChecklistTemplate>();
  return resource ?? null;
}

export async function updateTemplate(templateId: string, items: ChecklistItem[], projectTypeId?: string): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(TEMPLATES_CONTAINER);
  const { resource } = await container.item(templateId, templateId).read<ChecklistTemplate>();
  if (!resource) throw new Error('Template not found');
  resource.items = items;
  if (projectTypeId !== undefined) {
    resource.projectTypeId = projectTypeId;
  }
  await container.items.upsert(resource);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(TEMPLATES_CONTAINER);
  await container.item(templateId, templateId).delete();
}
