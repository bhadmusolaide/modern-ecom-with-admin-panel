import { auth } from '../admin';

/**
 * Sets admin custom claims for a Firebase user
 * 
 * @param uid The Firebase user ID to set admin claims for
 * @returns A promise that resolves when the claims are set
 */
export async function setAdminClaims(uid: string): Promise<void> {
  try {
    console.log(`Setting admin claims for user: ${uid}`);
    
    // Get the current user
    const user = await auth.getUser(uid);
    console.log(`User found: ${user.email}`);
    
    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`Admin claims set successfully for user: ${uid}`);
    
    return;
  } catch (error) {
    console.error('Error setting admin claims:', error);
    throw error;
  }
}
