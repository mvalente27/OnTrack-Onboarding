// src/lib/firebase/services/projects.ts
import { cosmosClient, blobServiceClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectChecklistItem, OnboardingStage, NewProjectData } from '../../types';
import { getTemplate } from '../teplates';
import { getProjectType } from './projectTypes';

const PROJECTS_CONTAINER = 'projects';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';

  const { name, email, projectTypeId, templateId, notes, companyId } = projectData;

  const [template, projectType] = await Promise.all([
    getTemplate(templateId),
    getProjectType(projectTypeId)
  ]);

  if (!template) {
    throw new Error("Checklist template not found for this project type.");
  }
  if (!projectType) {
    throw new Error("Project type not found.");
  }

  const checklist: ProjectChecklistItem[] = (template.items || []).map(item => ({
    id: item.id,
    label: item.label,
    type: item.type,
    roleId: item.roleId || '',
    requiresFile: item.requiresFile || false,
    stageName: item.stageName || '',
    dueDate: item.dueDate || '',
    status: 'pending',
    notes: '',
    fileUrl: '',
    fileName: '',
  }));

  const stages: OnboardingStage[] = projectType.stages.map((stageName, index) => ({
    name: stageName,
    status: index === 0 ? 'in_progress' : 'pending',
  }));

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const item = {
    id,
    companyId,
    name,
    email: email || '',
    projectTypeId,
    projectTypeName: projectType.name,
    notes: notes || '',
    checklist,
    stages,
    createdAt,
    assignedUserId: '',
  };

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  await container.items.create(item);
  return id;
}


  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  let query = `SELECT * FROM c WHERE c.companyId = @companyId`;
  const parameters: any[] = [{ name: "@companyId", value: companyId }];
  if (accessibleProjectTypeIds && accessibleProjectTypeIds.length > 0) {
    query += ` AND ARRAY_CONTAINS(@projectTypeIds, c.projectTypeId)`;
    parameters.push({ name: "@projectTypeIds", value: accessibleProjectTypeIds });
  } else if (accessibleProjectTypeIds && accessibleProjectTypeIds.length === 0) {
    return [];
  }
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  return resources as Project[];
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource } = await container.item(projectId, projectId).read<Project>();
  return resource ?? null;
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource } = await container.item(projectId, projectId).read<Project>();
  if (!resource) throw new Error("Project not found.");
  resource.checklist = checklist;
  await container.items.upsert(resource);
}


  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource } = await container.item(projectId, projectId).read<Project>();
  if (!resource) throw new Error("Project not found.");
  resource.stages = stages;
  await container.items.upsert(resource);
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource } = await container.item(projectId, projectId).read<Project>();
  if (!resource) throw new Error("Project not found.");
  resource.assignedUserId = userId;
  await container.items.upsert(resource);
}


  const container = cosmosClient.database(cosmosClient.options.databaseId).container(PROJECTS_CONTAINER);
  const { resource } = await container.item(projectId, projectId).read<Project>();
  if (!resource) return;
  // Delete associated files from Azure Blob Storage
  if (resource.checklist) {
    const fileDeletePromises = resource.checklist
      .filter(item => !!item.fileUrl)
      .map(item => deleteChecklistFileAzure(item.fileUrl!));
    await Promise.all(fileDeletePromises);
  }
  // Delete the project document from Cosmos DB
  await container.item(projectId, projectId).delete();
}

// Helper for deleting files from Azure Blob Storage
async function deleteChecklistFileAzure(fileUrl: string): Promise<void> {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join('/');
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (err) {
    console.error('Failed to delete file from Azure Blob Storage:', err);
  }
}
