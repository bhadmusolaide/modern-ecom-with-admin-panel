import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Add security headers to all responses
 * 
 * @param response - The Next.js response object
 * @returns The response with security headers added
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  // Customize this based on your application's needs
  const cspHeader = process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com 'unsafe-inline'; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://firestore.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.googleapis.com https://firebasestorage.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.firebaseapp.com; object-src 'none'"
    : ""; // In development, don't set CSP to avoid issues with hot reloading

  // Set security headers
  const headers = {
    // Basic security headers
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Content Security Policy (only in production)
    ...(cspHeader ? { 'Content-Security-Policy': cspHeader } : {}),
    
    // Strict Transport Security (only in production)
    ...(process.env.NODE_ENV === 'production' 
      ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } 
      : {})
  };

  // Add headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware to add security headers to all responses
 * 
 * @param request - The Next.js request object
 * @param response - The Next.js response object
 * @returns The response with security headers added
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  return addSecurityHeaders(response);
}