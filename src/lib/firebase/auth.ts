// src/lib/firebase/auth.ts
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { app, db } from './config';
import { createUserProfile } from './services/users';
import { createCompany, findCompanyByName } from './services/companies';
import { createRole } from './services/roles';
import { createProjectType } from './services/projectTypes';
import { createLeadSource } from './services/leadSources';
import { createTemplate, updateTemplate } from './services/templates';
import type { ChecklistItem } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { getPendingInvitation, markInvitationAsCompleted } from './services/invitations';


let auth: Auth;

const getAuthInstance = () => {
    if (!auth) {
        auth = getAuth(app);
    }
    return auth;
}

const createDefaultCompanyData = async (companyId: string, adminRoleId: string) => {
    // 1. Create a default Project Type
    const projectTypeStages = ['Contract Signed', 'Data Collection', 'Kick-off Call', 'Execution', 'Final Review'];
    const projectTypeId = await createProjectType(companyId, 'Client Onboarding', projectTypeStages, true);

    // 2. Create default Lead Sources
    const defaultSources = ['Website', 'Referral', 'Advertisement', 'Social Media'];
    for (const sourceName of defaultSources) {
        await createLeadSource(companyId, sourceName);
    }
    
    // 3. Create a default Checklist Template and link it to the project type
    const defaultItems: Omit<ChecklistItem, 'id'>[] = [
        { label: 'Collect Signed Contract', type: 'checkbox', roleId: '', requiresFile: true, stageName: 'Contract Signed' },
        { label: 'Gather Property Details', type: 'textarea', roleId: '' , stageName: 'Data Collection'},
        { label: 'Set up Client Portal Access', type: 'checkbox', roleId: '', stageName: 'Data Collection' },
        { label: 'Schedule Kick-off Call', type: 'date', roleId: '', stageName: 'Kick-off Call' },
        { label: 'Finalize Accounting Setup', type: 'checkbox', roleId: '', stageName: 'Final Review' },
    ];
    const templateId = await createTemplate(companyId, 'Standard Client Onboarding');
    const itemsWithIds = defaultItems.map((item, index) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
    }));
    // Now also pass the projectTypeId to link them
    await updateTemplate(templateId, itemsWithIds, projectTypeId);

    // 4. Update the admin role to have access to this new project type
    const adminRoleDoc = doc(db, 'roles', adminRoleId);
    await updateDoc(adminRoleDoc, {
        projectTypeIds: [projectTypeId]
    });
};


export const signUpWithEmail = async (email: string, password: string, fullName: string, companyName: string): Promise<User> => {
  const auth = getAuthInstance();
  
  // Check if an invitation exists for this email. If so, they are joining an existing company.
  const invitation = await getPendingInvitation(email);

  if (invitation) {
    // Invitation exists, proceed with sign-up for an existing company
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });
    
    // Create the user profile with the company and role from the invitation
    await createUserProfile(user, invitation.companyId, invitation.roleId);
    
    // Mark the invitation as completed
    await markInvitationAsCompleted(invitation.id, user.uid);
    
    return user;
  }
  
  // If no invitation, check if they are trying to create a new company.
  if (companyName) {
    // Check if a company with this name already exists to prevent duplicates
    const existingCompany = await findCompanyByName(companyName);
    if (existingCompany) {
        throw new Error(`A company with the name "${companyName}" already exists. Please choose a different name or ask for an invitation.`);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: fullName });

    // Create the new company and default data
    const companyId = await createCompany(companyName, user.uid);
    const adminRoleId = await createRole(companyId, 'Admin', ['manage_all'], []);
    await createUserProfile(user, companyId, adminRoleId);
    await createDefaultCompanyData(companyId, adminRoleId);
    
    return user;
  }
  
  // If no invitation and no company name was provided, the sign-up cannot proceed.
  throw new Error("You must either provide a new company name or have a pending invitation to sign up.");
};

export const signInWithEmail = (email: string, password: string): Promise<User> => {
  return signInWithEmailAndPassword(getAuthInstance(), email, password)
    .then(userCredential => userCredential.user);
};

export const signOutUser = (): Promise<void> => {
  return signOut(getAuthInstance());
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(getAuthInstance(), callback);
};
