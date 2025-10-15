import { auth } from '../admin';

/**
 * Sets admin custom claims for a Firebase user
 * 
 * @param uid The Firebase user ID to set admin claims for
 * @returns A promise that resolves when the claims are set
 */
export async function setAdminClaims(uid: string): Promise<void> {
  try {

    // Get the current user
    const user = await auth.getUser(uid);

    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });

    return;
  } catch (error) {
    console.error('Error setting admin claims:', error);
    throw error;
  }
}
