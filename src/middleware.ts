import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const verifyUrl = '/api/verify-session'; // use relative path
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000); // abort after 3s

  try {
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: request.headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!verifyResponse.ok) {
      console.warn('Session verification failed:', verifyResponse.statusText);
      return NextResponse.next();
    }

    const session = await verifyResponse.json();

    if (!session || !session.user) {
      console.warn('No valid session found');
      return NextResponse.next();
    }

    // Proceed if session is valid
    return NextResponse.next();
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      console.warn('Session verification timed out or network error - allowing request to proceed');
      return NextResponse.next();
    }

    console.error('Error during session verification request:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
