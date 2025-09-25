import { z } from 'zod';

export type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'waived';

export interface OnboardingStage {
  name: string;
  status: OnboardingStatus;
}

export type LeadStage =
  | 'Potential Deal'
  | 'Data Sheet Submitted'
  | 'Meeting Scheduled'
  | 'Need to Send Proposals'
  | 'Proposal Sent'
  | 'Contract Sent'
  | 'Contract Signed'
  | 'Onboarding'
  | 'Closed';

// Base type for all company-owned data
export interface CompanyData {
    companyId: string;
}

export interface Company {
    id: string;
    name: string;
    ownerId: string;
    createdAt: any;
}

export interface Lead extends CompanyData {
  id: string;
  clientName: string;
  stage: LeadStage;
  unitCount?: number;
  location?: string;
  apts?: string;
  l1l2?: 'L1' | 'L2';
  notes?: string;
  email: string;
  inquiryDate?: string; // Should be ISO date string
  files?: string[]; // Array of file URLs
  annualFee?: number;
  startDate?: string; // Should be ISO date string
  monthlyFee?: number;
  proposalSentDate?: string; // Should be ISO date string
  followUpDate?: string; // Should be ISO date string
  leadSource?: string;
  endingFee?: number;
  team?: string;
  referralName?: string;
  outgoingMgmtCo?: string;
  closeDate?: string; // Should be ISO date string
  dealLength?: number; // in months
  dealCreationDate: string; // Should be ISO date string
  templateId?: string; // The ID of the data sheet template
  projectTypeId?: string; // The ID of the project type
  onboardingTemplateId?: string; // The ID of the internal onboarding template
  priority?: 'High' | 'Medium' | 'Low';
  priorityJustification?: string;
}

export interface NewLeadData extends CompanyData {
  projectTypeId: string;
  templateId: string;
  formData: Record<string, any>;
  clientName: string;
  email: string;
  stage: LeadStage;
  leadSource?: string;
  unitCount?: number;
  notes?: string;
}

export interface NewProjectData extends CompanyData {
  name: string;
  email?: string;
  projectTypeId: string;
  templateId: string;
  notes?: string;
}


export interface ChecklistTemplate extends CompanyData {
  id: string;
  name: string;
  items: ChecklistItem[];
  createdAt?: any;
  projectTypeId?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'textarea';
  roleId?: string;
  requiresFile?: boolean;
  stageName?: string;
  dueDate?: string;
}

export type Permission = 
  | 'manage_all'
  | 'view_leads'
  | 'edit_leads'
  | 'delete_leads'
  | 'view_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'view_templates'
  | 'edit_templates'
  | 'delete_templates'
  | 'view_roles'
  | 'edit_roles'
  | 'delete_roles'
  | 'view_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_email_templates'
  | 'edit_email_templates'
  | 'delete_email_templates';

export interface Role extends CompanyData {
  id: string;
  name: string;
  permissions: Permission[];
  projectTypeIds?: string[]; // Which project types this role can access
  createdAt?: any;
}

export interface PermissionCategory {
    title: string;
    permissions: Permission[];
}


export interface LeadSource extends CompanyData {
  id: string;
  name: string;
  createdAt?: any;
}

export interface ProjectType extends CompanyData {
  id: string;
  name: string;
  stages: string[];
  isSales: boolean; // New field to indicate if it's a sales-related workflow
  createdAt?: any;
}

// Represents a checklist item attached to a specific client, with its own status
export interface ProjectChecklistItem extends ChecklistItem {
  status: OnboardingStatus;
  notes?: string;
  assignedUserId?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Project extends CompanyData {
  id: string;
  name: string;
  email: string;
  leadId?: string; // To trace back to the original lead (optional)
  projectTypeId: string;
  projectTypeName: string;
  stages: OnboardingStage[]; // High-level stages for the tracker
  checklist: ProjectChecklistItem[];
  createdAt: any;
  notes?: string;
  assignedUserId?: string; // The UID of the user assigned to this project
}

export interface AppUser extends CompanyData {
  uid: string;
  email: string;
  displayName?: string;
  roleId?: string;
  role?: Role; // Populated client-side
  createdAt: any;
}

export interface EmailTemplate extends CompanyData {
    id: string;
    name: string;
    subject: string;
    body: string;
    projectTypeId: string;
    stageName: string;
    createdAt?: any;
}

export interface Invitation extends CompanyData {
    id: string;
    email: string;
    roleId: string;
    status: 'pending' | 'completed';
    createdAt: any;
    completedAt?: any;
    completedByUid?: string;
}

// Genkit Flow Schemas
export const GenerateClientEmailInputSchema = z.object({
  clientName: z.string().describe('The name of the client receiving the email.'),
  formUrl: z.string().url().describe('The unique URL for the client to access their data form.'),
});
export type GenerateClientEmailInput = z.infer<typeof GenerateClientEmailInputSchema>;

export const GenerateClientEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email in plain text.'),
});
export type GenerateClientEmailOutput = z.infer<typeof GenerateClientEmailOutputSchema>;


export const PrioritizeLeadInputSchema = z.object({
    clientName: z.string().describe("The name of the potential client or property."),
    unitCount: z.number().optional().describe("The number of units associated with the lead."),
    notes: z.string().optional().describe("Any additional notes or details about the lead."),
});
export type PrioritizeLeadInput = z.infer<typeof PrioritizeLeadInputSchema>;

export const PrioritizeLeadOutputSchema = z.object({
    priority: z.enum(["High", "Medium", "Low"]).describe("The calculated priority of the lead."),
    justification: z.string().describe("A brief justification for why the lead was assigned this priority.")
});
export type PrioritizeLeadOutput = z.infer<typeof PrioritizeLeadOutputSchema>;

export const SuggestProjectStagesInputSchema = z.object({
  projectTypeName: z.string().describe('The name of the business process or workflow for which to suggest stages. For example: "New Client Onboarding", "Property Acquisition", "Tenant Eviction Process".'),
});
export type SuggestProjectStagesInput = z.infer<typeof SuggestProjectStagesInputSchema>;

export const SuggestProjectStagesOutputSchema = z.object({
  stages: z.array(z.string()).describe("A list of suggested Kanban stages for the workflow. The list should contain between 4 and 7 stages."),
});
export type SuggestProjectStagesOutput = z.infer<typeof SuggestProjectStagesOutputSchema>;

export const GenerateMissingItemsReportInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  items: z.array(z.object({
    label: z.string().describe('The name or description of the checklist task.'),
    status: z.enum(['pending', 'in_progress', 'completed', 'waived']).describe('The current status of the task.'),
  })).describe('The list of checklist items for the project.'),
});
export type GenerateMissingItemsReportInput = z.infer<typeof GenerateMissingItemsReportInputSchema>;

export const GenerateMissingItemsReportOutputSchema = z.object({
  report: z.string().describe('The generated report in plain text, summarizing the outstanding items.'),
});
export type GenerateMissingItemsReportOutput = z.infer<typeof GenerateMissingItemsReportOutputSchema>;


export const SuggestChecklistItemsInputSchema = z.object({
  templateName: z.string().describe("The name of the onboarding template for which to suggest checklist items. e.g., 'Residential Property Onboarding'"),
});
export type SuggestChecklistItemsInput = z.infer<typeof SuggestChecklistItemsInputSchema>;

export const SuggestChecklistItemsOutputSchema = z.object({
  items: z.array(z.object({
    label: z.string().describe('A clear, actionable label for the checklist item.'),
    type: z.enum(['text', 'number', 'date', 'checkbox', 'textarea']).describe('The most appropriate input type for the item.'),
    requiresFile: z.boolean().describe('Whether this item typically requires a document upload.'),
  })).describe('A list of 5 to 10 suggested checklist items.'),
});
export type SuggestChecklistItemsOutput = z.infer<typeof SuggestChecklistItemsOutputSchema>;

export const SummarizeProjectStatusInputSchema = z.object({
  projectName: z.string().describe("The name of the project."),
  currentStage: z.string().describe("The current stage of the project in its workflow."),
  totalTasks: z.number().describe("The total number of checklist items in the project."),
  completedTasks: z.number().describe("The number of completed checklist items."),
  inProgressTasks: z.number().describe("The number of in-progress checklist items."),
  pendingTasks: z.number().describe("The number of pending checklist items."),
  projectManager: z.string().describe("The name of the overall project manager or main assignee."),
  taskAssignees: z.array(z.string()).describe("A list of names of team members assigned to individual tasks in the project."),
});
export type SummarizeProjectStatusInput = z.infer<typeof SummarizeProjectStatusInputSchema>;

export const SummarizeProjectStatusOutputSchema = z.object({
  summary: z.string().describe("A concise, one-paragraph summary of the project's status."),
});
export type SummarizeProjectStatusOutput = z.infer<typeof SummarizeProjectStatusOutputSchema>;
