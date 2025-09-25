// src/lib/firebase/services/leadSources.ts
import { db } from '../config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import type { LeadSource } from '@/lib/types';

const LEAD_SOURCES_COLLECTION = 'leadSources';

export async function createLeadSource(companyId: string, name: string): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = await addDoc(collection(db, LEAD_SOURCES_COLLECTION), {
        companyId,
        name,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getLeadSources(companyId: string): Promise<LeadSource[]> {
  if (!db) return [];
  const q = query(
    collection(db, LEAD_SOURCES_COLLECTION),
    where('companyId', '==', companyId)
  );
  const querySnapshot = await getDocs(q);
  const sources = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<LeadSource, 'id'>),
  }));
  // Sort by name in the application code
  return sources.sort((a, b) => a.name.localeCompare(b.name));
}

export async function deleteLeadSource(leadSourceId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = doc(db, LEAD_SOURCES_COLLECTION, leadSourceId);
    await deleteDoc(docRef);
}
