// src/lib/firebase/services/emailTemplates.ts
import { db } from '../config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  serverTimestamp,
  getDoc,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import type { EmailTemplate } from '@/lib/types';

const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';

export async function createEmailTemplate(
  companyId: string,
  data: Omit<EmailTemplate, 'id' | 'companyId' | 'createdAt'>
): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = await addDoc(collection(db, EMAIL_TEMPLATES_COLLECTION), {
        companyId,
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getEmailTemplates(companyId: string, projectTypeId?: string): Promise<EmailTemplate[]> {
  if (!db) return [];

  const constraints: QueryConstraint[] = [
    where('companyId', '==', companyId)
  ];

  if (projectTypeId) {
    constraints.push(where('projectTypeId', '==', projectTypeId));
  }

  const q = query(
    collection(db, EMAIL_TEMPLATES_COLLECTION),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  const templates = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<EmailTemplate, 'id'>),
  }));
  // Sort by name in application code
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
    if (!db) return null;
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as Omit<EmailTemplate, 'id'>) };
    }
    return null;
}

export async function updateEmailTemplate(
    id: string,
    data: Partial<Omit<EmailTemplate, 'id' | 'companyId' | 'createdAt'>>
): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, data);
}

export async function deleteEmailTemplate(id: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
}
