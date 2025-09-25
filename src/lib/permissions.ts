// src/lib/permissions.ts

import type { Permission, PermissionCategory } from './types';

// The single source of truth for all available permissions
export const availablePermissions: Permission[] = [
    'manage_all',
    'view_leads',
    'edit_leads',
    'delete_leads',
    'view_projects',
    'edit_projects',
    'delete_projects',
    'view_templates',
    'edit_templates',
    'delete_templates',
    'view_roles',
    'edit_roles',
    'delete_roles',
    'view_users',
    'edit_users',
    'delete_users',
    'view_email_templates',
    'edit_email_templates',
    'delete_email_templates',
];

// A helper structure to group permissions by category in the UI
export const permissionCategories: Record<string, PermissionCategory> = {
    general: {
        title: 'Super Admin',
        permissions: ['manage_all'],
    },
    leads: {
        title: 'Leads',
        permissions: ['view_leads', 'edit_leads', 'delete_leads'],
    },
    projects: {
        title: 'Projects',
        permissions: ['view_projects', 'edit_projects', 'delete_projects'],
    },
    templates: {
        title: 'Checklist Templates',
        permissions: ['view_templates', 'edit_templates', 'delete_templates'],
    },
     emailTemplates: {
        title: 'Email Templates',
        permissions: ['view_email_templates', 'edit_email_templates', 'delete_email_templates'],
    },
    admin: {
        title: 'Administration',
        permissions: ['view_roles', 'edit_roles', 'delete_roles', 'view_users', 'edit_users', 'delete_users'],
    },
};
