// Checklist/Template stubs
// ...existing code...
export async function createTemplateAzure(companyId: string, name: string) { return { id: 'test-template', name }; }
export async function deleteTemplateAzure(templateId: string) { return true; }

// Roles stubs
export async function createRoleAzure(companyId: string, name: string, permissions: any[]) { return { id: 'test-role', name, permissions }; }
export async function deleteRoleAzure(roleId: string) { return true; }

// Template update stub
export async function updateTemplateAzure(templateId: string, items: any[], projectTypeId: string) { return true; }
// --- Azure Cosmos DB function stubs for testing ---
export async function getProjectsAzure(companyId: string, projectTypeIds?: string[]) { return []; }
export async function getLeadsAzure(companyId: string, projectTypeIds?: string[]) { return []; }
export async function getUsersAzure(companyId: string) { return []; }
export async function getRolesAzure(companyId: string) { return []; }
export async function getTemplatesAzure(companyId: string) { return []; }
export async function getProjectTypesAzure(companyId: string) { return []; }
export async function getLeadSourcesAzure(companyId: string) { return []; }
export async function createLeadAzure(data: any) { return { id: 'test-lead' }; }
export async function createProjectAzure(data: any) { return { id: 'test-project' }; }
export async function getTemplateAzure(templateId: string) { return null; }
export async function getRoleAzure(roleId: string) { return null; }
export async function updateRolePermissionsAzure(roleId: string, permissions: any, projectTypeIds: any) { return true; }
export async function getLeadAndTemplateAzure(leadId: string) { return null; }
export async function updateLeadDataAzure(leadId: string, formData: any) { return true; }
// ...existing code...
// src/lib/azure/cosmos.ts
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';

// Replace with your Azure Cosmos DB endpoint and database info
const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
const key = process.env.AZURE_COSMOS_KEY || '';
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'ontrack';
const containerId = process.env.AZURE_COSMOS_CONTAINER || 'projects';

// Use DefaultAzureCredential for managed identity, or key for local/dev
const client = key
  ? new CosmosClient({ endpoint, key })
  : new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });

export async function updateProjectStagesAzure(projectId: string, newStages: any[]) {
  const database = client.database(databaseId);
  const container = database.container(containerId);
  // Query for the project by ID
  const { resource: project } = await container.item(projectId, projectId).read();
  if (!project) throw new Error('Project not found');
  project.stages = newStages;
  // Update the project document
  const { resource: updated } = await container.items.upsert(project);
  return updated;
}

// Add more Cosmos DB helpers as needed
