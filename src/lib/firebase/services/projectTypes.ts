// src/lib/firebase/services/projectTypes.ts
import { cosmosClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectType } from '../../types';

const PROJECT_TYPES_CONTAINER = 'projectTypes';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';

export async function createProjectType(companyId: string, name: string, stages: string[], isSales: boolean): Promise<string> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const item: ProjectType = {
    id,
    companyId,
    name,
    stages,
    isSales,
    createdAt,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  await container.items.create(item);
  return id;
}

export async function getProjectTypes(companyId: string): Promise<ProjectType[]> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const query = 'SELECT * FROM c WHERE c.companyId = @companyId';
  const parameters = [{ name: '@companyId', value: companyId }];
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort by name in application code
  return (resources as ProjectType[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectType(id: string): Promise<ProjectType | null> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const { resource } = await container.item(id, id).read<ProjectType>();
  return resource ?? null;
}

export async function updateProjectType(projectTypeId: string, name: string, stages: string[], isSales: boolean): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const { resource } = await container.item(projectTypeId, projectTypeId).read<ProjectType>();
  if (!resource) throw new Error('Project type not found');
  resource.name = name;
  resource.stages = stages;
  resource.isSales = isSales;
  await container.items.upsert(resource);
}

export async function deleteProjectType(projectTypeId: string): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  await container.item(projectTypeId, projectTypeId).delete();
}
// src/lib/firebase/services/projectTypes.ts
import { cosmosClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectType } from '../../types';

const PROJECT_TYPES_CONTAINER = 'projectTypes';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';
export async function createProjectType(companyId: string, name: string, stages: string[], isSales: boolean): Promise<string> {
// ...existing code...

export async function getProjectTypes(companyId: string): Promise<ProjectType[]> {
// ...existing code...

export async function getProjectType(id: string): Promise<ProjectType | null> {
// ...existing code...

export async function updateProjectType(projectTypeId: string, name: string, stages: string[], isSales: boolean): Promise<void> {
// ...existing code...

export async function deleteProjectType(projectTypeId: string): Promise<void> {
// ...existing code...

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const item: ProjectType = {
    id,
    companyId,
    name,
    stages,
    isSales,
    createdAt,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  await container.items.create(item);
  return id;
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const query = 'SELECT * FROM c WHERE c.companyId = @companyId';
  const parameters = [{ name: '@companyId', value: companyId }];
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort by name in application code
  return (resources as ProjectType[]).sort((a, b) => a.name.localeCompare(b.name));
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const { resource } = await container.item(id, id).read<ProjectType>();
  return resource ?? null;
}


  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  const { resource } = await container.item(projectTypeId, projectTypeId).read<ProjectType>();
  if (!resource) throw new Error('Project type not found');
  resource.name = name;
  resource.stages = stages;
  resource.isSales = isSales;
  await container.items.upsert(resource);
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECT_TYPES_CONTAINER);
  await container.item(projectTypeId, projectTypeId).delete();
}
