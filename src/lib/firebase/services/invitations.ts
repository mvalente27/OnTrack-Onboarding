// src/lib/firebase/services/invitations.ts
import { db } from '../config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import type { Invitation } from '@/lib/types';

const INVITATIONS_COLLECTION = 'invitations';

/**
 * Creates a new invitation document in Firestore.
 * @param companyId The ID of the company the user is being invited to.
 * @param email The email of the user to invite.
 * @param roleId The ID of the role to assign to the user.
 * @returns The ID of the newly created invitation.
 */
export async function createInvitation(companyId: string, email: string, roleId: string): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");

  // Check if an active invitation already exists for this email
  const existingInvitation = await getPendingInvitation(email);
  if (existingInvitation) {
    throw new Error("An active invitation for this email already exists.");
  }

  const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), {
    companyId,
    email: email.toLowerCase(), // Store emails in lowercase for case-insensitive matching
    roleId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Finds a pending invitation for a given email address.
 * @param email The email to look for.
 * @returns The invitation object or null if not found.
 */
export async function getPendingInvitation(email: string): Promise<Invitation | null> {
    if (!db) return null;
    const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where("email", "==", email.toLowerCase()),
        where("status", "==", "pending"),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Invitation;
}

/**
 * Marks an invitation as completed.
 * @param invitationId The ID of the invitation to update.
 * @param userId The UID of the user who completed the invitation.
 */
export async function markInvitationAsCompleted(invitationId: string, userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    await updateDoc(invitationRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedByUid: userId,
    });
}
