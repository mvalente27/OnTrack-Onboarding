// src/lib/firebase/file-storage.ts
import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 * @param projectId - The ID of the project.
 * @param itemId - The ID of the checklist item.
 * @param file - The file to upload.
 * @returns The download URL of the uploaded file.
 */
export async function uploadChecklistFile(
  projectId: string,
  itemId: string,
  file: File
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized.");
  const filePath = `projects/${projectId}/checklist/${itemId}/${file.name}`;
  const fileRef = ref(storage, filePath);

  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * Deletes a file from Firebase Storage.
 * @param fileUrl - The URL of the file to delete.
 */
export async function deleteChecklistFile(fileUrl: string): Promise<void> {
  if (!storage) throw new Error("Firebase Storage is not initialized.");
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error: any) {
    // It's okay if the file doesn't exist (e.g., already deleted).
    // Other errors should be thrown.
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting file from storage:", error);
      throw error;
    }
  }
}
