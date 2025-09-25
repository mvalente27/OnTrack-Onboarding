// src/lib/firebase/services/users.ts
import { db } from '../config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { AppUser } from '@/lib/types';

const USERS_COLLECTION = 'users';

/**
 * Creates a user profile document in Firestore.
 * This is typically called right after a user signs up.
 * @param user - The Firebase Auth user object.
 * @param companyId - The ID of the company the user belongs to.
 * @param roleId - The ID of the role to assign. Can be empty for new users joining a company.
 */
export async function createUserProfile(user: FirebaseAuthUser, companyId: string, roleId: string = ''): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      companyId: companyId,
      roleId: roleId, // Role can be assigned later by an admin
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Retrieves a specific user's profile from Firestore.
 * @param uid - The user's unique ID.
 */
export async function getUser(uid: string): Promise<AppUser | null> {
    if (!db) return null;
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppUser;
    }
    return null;
}

/**
 * Retrieves all user profiles from a specific company.
 */
export async function getUsers(companyId: string): Promise<AppUser[]> {
  if (!db) return [];
  const q = query(collection(db, USERS_COLLECTION), where('companyId', '==', companyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as AppUser);
}

/**
 * Updates a user's assigned role.
 * @param uid - The user's unique ID.
 * @param roleId - The ID of the role to assign.
 */
export async function updateUserRole(uid: string, roleId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { roleId });
}

/**
 * Deletes a user's profile from Firestore.
 * NOTE: This does NOT delete the user from Firebase Authentication.
 * That requires the Firebase Admin SDK and should be handled in a Cloud Function.
 * @param uid - The user's unique ID.
 */
export async function deleteUserAndAccount(uid: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  // This is a simplified version. A real-world app would use a Cloud Function
  // to delete the user from Firebase Auth and then delete their Firestore doc.
  const userRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
}
