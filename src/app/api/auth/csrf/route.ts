import { generateCsrfToken } from '@/lib/csrf';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

export async function GET() {
  try {

    // Generate a token using our function
    const csrfToken = generateCsrfToken();

    // Return the token in the response
    const response = createApiResponse({ csrfToken });
    response.headers.set('X-CSRF-Generated', 'true');

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return createErrorResponse(
      'Failed to generate CSRF token',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
