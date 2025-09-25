// src/lib/firebase/services/companies.ts
import { db } from '../config';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import type { Company } from '@/lib/types';

const COMPANIES_COLLECTION = 'companies';

/**
 * Creates a new company document in Firestore.
 * This is called when the first user from a new company signs up.
 * @param name - The name of the company.
 * @param ownerId - The UID of the user who owns this company.
 * @returns The ID of the newly created company.
 */
export async function createCompany(name: string, ownerId: string): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), {
    name,
    ownerId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Finds a company by its exact name.
 * @param name - The name of the company to find.
 * @returns The company object including its ID, or null if not found.
 */
export async function findCompanyByName(name: string): Promise<Company | null> {
    if (!db) throw new Error("Firestore is not initialized.");
    const q = query(
        collection(db, COMPANIES_COLLECTION),
        where("name", "==", name),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const companyDoc = querySnapshot.docs[0];
    return { id: companyDoc.id, ...companyDoc.data() } as Company;
}
