import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createApiResponse } from '@/lib/auth/apiResponse';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({}, 200);
}

export async function POST(request: NextRequest) {
  try {
    // Get the cookies store
    const cookieStore = await cookies();
    
    // Clear the session cookie
    cookieStore.delete('session');
    
    // Clear any other auth-related cookies
    cookieStore.delete('firebase-token');
    cookieStore.delete('user-session');
    
    console.log('User logged out, session cookies cleared');
    
    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return createApiResponse({ 
      success: false, 
      error: 'Failed to complete logout' 
    }, 500);
  }
}
