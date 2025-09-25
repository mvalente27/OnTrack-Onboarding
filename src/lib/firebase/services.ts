// src/lib/firebase/services.ts
/**
 * @fileoverview This file serves as the main entry point for all Firebase service functions.
 * It consolidates and re-exports functions from the domain-specific service files
 * (e.g., projects, leads, templates) to provide a single, organized interface for
 * components to interact with Firebase services.
 */

import { convertLeadToProject, createLead, deleteLead, getLeadAndTemplate, getLeads, updateLeadData, updateLeadStage } from './services/leads';
import { getLeadSources, createLeadSource, deleteLeadSource } from './services/leadSources';
import { getTemplate, getTemplates, createTemplate, updateTemplate, deleteTemplate } from './services/templates';
import { getProjects, getProject, updateProjectChecklist, updateProjectStages, deleteProject, createProject, assignUserToProject } from './services/projects';
import { getRoles, createRole, deleteRole, getRole, updateRolePermissions } from './services/roles';
import { getProjectTypes, createProjectType, deleteProjectType, updateProjectType, getProjectType } from './services/projectTypes';
import { getUsers, updateUserRole, deleteUserAndAccount, getUser, createUserProfile } from './services/users';
import { createCompany, findCompanyByName } from './services/companies';
import { createEmailTemplate, getEmailTemplates, getEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from './services/emailTemplates';
import { createInvitation, getPendingInvitation, markInvitationAsCompleted } from './services/invitations';


// Re-export all functions to be used in the app
export {
    // Lead-related functions
    createLead,
    getLeads,
    getLeadAndTemplate,
    updateLeadData,
    updateLeadStage,
    deleteLead,
    convertLeadToProject,
    getLeadSources,
    createLeadSource,
    deleteLeadSource,
    
    // Template-related functions
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Project-related functions
    getProjects,
    getProject,
    updateProjectChecklist,
    updateProjectStages,
    deleteProject,
    createProject,
    assignUserToProject,

    // Role-related functions
    getRoles,
    createRole,
    deleteRole,
    getRole,
    updateRolePermissions,

    // Project Type related functions
    getProjectTypes,
    createProjectType,
    deleteProjectType,
    updateProjectType,
    getProjectType,

    // User-related functions
    getUsers,
    updateUserRole,
    deleteUserAndAccount,
    getUser,
    createUserProfile,

    // Company-related functions
    createCompany,
    findCompanyByName,

    // Email Template-related functions
    createEmailTemplate,
    getEmailTemplates,
    getEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,

    // Invitation-related functions
    createInvitation,
    getPendingInvitation,
    markInvitationAsCompleted,
};
