
// src/lib/firebase/services/leads.ts
import { cosmosClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { NewLeadData, Lead, LeadStage, LeadSource, ProjectChecklistItem, Project, ProjectType, CompanyData } from '../../types';
import { prioritizeLead } from '../../ai/flows/prioritize-lead-flow';
import { getTemplate } from '../teplates';
import { getProjectType } from './projectTypes';

const LEADS_CONTAINER = 'leads';
const PROJECTS_CONTAINER = 'projects';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';

export async function createLead(leadData: NewLeadData): Promise<string> {
  const priorityResult = await prioritizeLead({
    clientName: leadData.clientName,
    unitCount: leadData.unitCount,
    notes: leadData.notes,
  });
  const id = uuidv4();
  const dealCreationDate = new Date().toISOString();
  const item: Lead = {
    id,
    ...leadData.formData,
    companyId: leadData.companyId,
    clientName: leadData.clientName,
    email: leadData.email,
    stage: leadData.stage,
    templateId: leadData.templateId,
    projectTypeId: leadData.projectTypeId,
    leadSource: leadData.leadSource || '',
    unitCount: leadData.unitCount,
    notes: leadData.notes,
    priority: priorityResult.priority,
    priorityJustification: priorityResult.justification,
    dealCreationDate,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.items.create(item);
  return id;
}

export async function getLeads(companyId: string, accessibleProjectTypeIds?: string[]): Promise<Lead[]> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  let query = `SELECT * FROM c WHERE c.companyId = @companyId`;
  const parameters: any[] = [{ name: "@companyId", value: companyId }];
  if (accessibleProjectTypeIds && accessibleProjectTypeIds.length > 0) {
    query += ` AND ARRAY_CONTAINS(@projectTypeIds, c.projectTypeId)`;
    parameters.push({ name: "@projectTypeIds", value: accessibleProjectTypeIds });
  } else if (accessibleProjectTypeIds && accessibleProjectTypeIds.length === 0) {
    return [];
  }
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort the leads by date descending in the application code.
  return (resources as Lead[]).sort((a, b) => new Date(b.dealCreationDate).getTime() - new Date(a.dealCreationDate).getTime());
}

export async function getLeadAndTemplate(leadId: string): Promise<{ lead: Lead; template: any } | null> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource: leadData } = await container.item(leadId, leadId).read<Lead>();
  if (!leadData) {
    console.error('Lead not found');
    return null;
  }
  if (!leadData.templateId) {
    console.error('Lead has no templateId');
    return null;
  }
  const template = await getTemplate(leadData.templateId);
  if (!template) {
    console.error('Template not found for lead');
    return null;
  }
  return { lead: leadData, template };
}

export async function updateLeadData(leadId: string, formData: Record<string, any>): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  Object.assign(resource, formData);
  resource.stage = 'Data Sheet Submitted';
  await container.items.upsert(resource);
}

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  resource.stage = stage;
  await container.items.upsert(resource);
}

export async function deleteLead(leadId: string): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.item(leadId, leadId).delete();
}

export async function convertLeadToProject(leadId: string): Promise<string> {
  const leadsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const projectsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource: leadData } = await leadsContainer.item(leadId, leadId).read<Lead>();
  if (!leadData) throw new Error('Lead not found');
  if (!leadData.templateId) throw new Error('Lead does not have a templateId.');
  const onboardingTemplate = await getTemplate(leadData.templateId);
  if (!onboardingTemplate) throw new Error('Onboarding template not found');
  if (!onboardingTemplate.projectTypeId) throw new Error('Onboarding template is not linked to a Project Type.');
  const projectType = await getProjectType(onboardingTemplate.projectTypeId);
  if (!projectType) throw new Error('Project Type not found for the selected template.');
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const projectChecklist: ProjectChecklistItem[] = (onboardingTemplate.items || []).map((item: any) => ({
    id: item.id,
    label: item.label,
    type: item.type,
    roleId: item.roleId || '',
    requiresFile: item.requiresFile || false,
    stageName: item.stageName || '',
    status: 'pending',
    notes: '',
    fileUrl: '',
    fileName: '',
  }));
  const projectData: Project = {
    id,
    companyId: leadData.companyId,
    name: leadData.clientName,
    email: leadData.email,
    leadId: leadId,
    projectTypeId: projectType.id,
    projectTypeName: projectType.name,
    stages: projectType.stages.map((stageName: string, index: number) => ({
      name: stageName,
      status: index === 0 ? 'in_progress' : 'pending',
    })),
    checklist: projectChecklist,
    createdAt,
  };
  await projectsContainer.items.create(projectData);
  leadData.stage = 'Onboarding';
  await leadsContainer.items.upsert(leadData);
  return id;
}

export async function createLead(leadData: NewLeadData): Promise<string> {
  const priorityResult = await prioritizeLead({
    clientName: leadData.clientName,
    unitCount: leadData.unitCount,
    notes: leadData.notes,
  });
  const id = uuidv4();
  const dealCreationDate = new Date().toISOString();
  const item: Lead = {
    id,
    ...leadData.formData,
    companyId: leadData.companyId,
    clientName: leadData.clientName,
    email: leadData.email,
    stage: leadData.stage,
    templateId: leadData.templateId,
    projectTypeId: leadData.projectTypeId,
    leadSource: leadData.leadSource || '',
    unitCount: leadData.unitCount || null,
    notes: leadData.notes || '',
    priority: priorityResult.priority,
    priorityJustification: priorityResult.justification,
    dealCreationDate,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.items.create(item);
  return id;
}

export async function getLeads(companyId: string, accessibleProjectTypeIds?: string[]): Promise<Lead[]> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  let query = `SELECT * FROM c WHERE c.companyId = @companyId`;
  const parameters: any[] = [{ name: "@companyId", value: companyId }];
  if (accessibleProjectTypeIds && accessibleProjectTypeIds.length > 0) {
    query += ` AND ARRAY_CONTAINS(@projectTypeIds, c.projectTypeId)`;
    parameters.push({ name: "@projectTypeIds", value: accessibleProjectTypeIds });
  } else if (accessibleProjectTypeIds && accessibleProjectTypeIds.length === 0) {
    return [];
  }
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort the leads by date descending in the application code.
  return (resources as Lead[]).sort((a, b) => new Date(b.dealCreationDate).getTime() - new Date(a.dealCreationDate).getTime());
}

export async function getLeadAndTemplate(leadId: string): Promise<{ lead: Lead; template: any } | null> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource: leadData } = await container.item(leadId, leadId).read<Lead>();
  if (!leadData) {
    console.error('Lead not found');
    return null;
  }
  if (!leadData.templateId) {
    console.error('Lead has no templateId');
    return null;
  }
  const template = await getTemplate(leadData.templateId);
  if (!template) {
    console.error('Template not found for lead');
    return null;
  }
  return { lead: leadData, template };
}

export async function updateLeadData(leadId: string, formData: Record<string, any>): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  Object.assign(resource, formData);
  resource.stage = 'Data Sheet Submitted';
  await container.items.upsert(resource);
}

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  resource.stage = stage;
  await container.items.upsert(resource);
}

export async function deleteLead(leadId: string): Promise<void> {
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.item(leadId, leadId).delete();
}

export async function convertLeadToProject(leadId: string): Promise<string> {
  const leadsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const projectsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource: leadData } = await leadsContainer.item(leadId, leadId).read<Lead>();
  if (!leadData) throw new Error('Lead not found');
  if (!leadData.templateId) throw new Error('Lead does not have a templateId.');
  const onboardingTemplate = await getTemplate(leadData.templateId);
  if (!onboardingTemplate) throw new Error('Onboarding template not found');
  if (!onboardingTemplate.projectTypeId) throw new Error('Onboarding template is not linked to a Project Type.');
  const projectType = await getProjectType(onboardingTemplate.projectTypeId);
  if (!projectType) throw new Error('Project Type not found for the selected template.');
  const id = uuidv4();
  const createdAt = new Date().toISOString();

// LEAD FUNCTIONS
  const priorityResult = await prioritizeLead({
    clientName: leadData.clientName,
    unitCount: leadData.unitCount,
    notes: leadData.notes,
    clientName: leadData.clientName,
    email: leadData.email,
    stage: leadData.stage,
    templateId: leadData.templateId,
    projectTypeId: leadData.projectTypeId,
    leadSource: leadData.leadSource || '',
    unitCount: leadData.unitCount || null,
    notes: leadData.notes || '',
    priority: priorityResult.priority,
    priorityJustification: priorityResult.justification,
    dealCreationDate,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.items.create(item);
  return id;
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  let query = `SELECT * FROM c WHERE c.companyId = @companyId`;
  const parameters: any[] = [{ name: "@companyId", value: companyId }];
  if (accessibleProjectTypeIds && accessibleProjectTypeIds.length > 0) {
    query += ` AND ARRAY_CONTAINS(@projectTypeIds, c.projectTypeId)`;
    parameters.push({ name: "@projectTypeIds", value: accessibleProjectTypeIds });
  } else if (accessibleProjectTypeIds && accessibleProjectTypeIds.length === 0) {
    return [];
  }
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort the leads by date descending in the application code.
  return (resources as Lead[]).sort((a, b) => new Date(b.dealCreationDate).getTime() - new Date(a.dealCreationDate).getTime());
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource: leadData } = await container.item(leadId, leadId).read<Lead>();
  if (!leadData) {
    console.error('Lead not found');
    return null;
  }
  if (!leadData.templateId) {
    console.error('Lead has no templateId');
    return null;
  }
  const template = await getTemplate(leadData.templateId);
  if (!template) {
    console.error('Template not found for lead');
    return null;
  }
  return { lead: leadData, template };
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  Object.assign(resource, formData);
  resource.stage = 'Data Sheet Submitted';
  await container.items.upsert(resource);
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const { resource } = await container.item(leadId, leadId).read<Lead>();
  if (!resource) throw new Error('Lead not found');
  resource.stage = stage;
  await container.items.upsert(resource);
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  await container.item(leadId, leadId).delete();
}


// HANDOFF FUNCTION
  const leadsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(LEADS_CONTAINER);
  const projectsContainer = cosmosClient.database(COSMOS_DATABASE_ID).container(PROJECTS_CONTAINER);
  const { resource: leadData } = await leadsContainer.item(leadId, leadId).read<Lead>();
  if (!leadData) throw new Error('Lead not found');
  if (!leadData.templateId) throw new Error('Lead does not have a templateId.');
  const onboardingTemplate = await getTemplate(leadData.templateId);
  if (!onboardingTemplate) throw new Error('Onboarding template not found');
  if (!onboardingTemplate.projectTypeId) throw new Error('Onboarding template is not linked to a Project Type.');
  const projectType = await getProjectType(onboardingTemplate.projectTypeId);
  if (!projectType) throw new Error('Project Type not found for the selected template.');

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const projectChecklist: ProjectChecklistItem[] = (onboardingTemplate.items || []).map(item => ({
    id: item.id,
    label: item.label,
    type: item.type,
    roleId: item.roleId || '',
    requiresFile: item.requiresFile || false,
    stageName: item.stageName || '',
    status: 'pending',
    notes: '',
    fileUrl: '',
    fileName: '',
  }));
  const projectData: Project = {
    id,
    companyId: leadData.companyId,
    name: leadData.clientName,
    email: leadData.email,
    leadId: leadId,
    projectTypeId: projectType.id,
    projectTypeName: projectType.name,
    stages: projectType.stages.map((stageName, index) => ({
      name: stageName,
      status: index === 0 ? 'in_progress' : 'pending',
    })),
    checklist: projectChecklist,
    createdAt,
  };
  await projectsContainer.items.create(projectData);
  leadData.stage = 'Onboarding';
  await leadsContainer.items.upsert(leadData);
  return id;
}
