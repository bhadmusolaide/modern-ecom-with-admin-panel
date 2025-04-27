import { generateCsrfToken } from '@/lib/csrf';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

export async function GET() {
  try {
    console.log('CSRF token generation requested');

    // Generate a token using our function
    const csrfToken = generateCsrfToken();

    console.log(`CSRF token generated successfully, length: ${csrfToken.length}, preview: ${csrfToken.substring(0, 10)}...`);

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
