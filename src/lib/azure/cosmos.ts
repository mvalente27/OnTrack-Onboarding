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
