import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sign } from 'jsonwebtoken';
import { verifyCsrfToken } from '@/lib/csrf';
import { sendEmail, generateVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { auth } from '@/lib/firebase/admin';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth as clientAuth } from '@/lib/firebase/config';
import { db as clientDb } from '@/lib/firebase/config';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Get CSRF token from validation data
    const { csrfToken } = validation.data;

    // Verify CSRF token
    console.log('CSRF token provided for signup:', csrfToken ? 'Yes' : 'No');

    if (csrfToken) {
      try {
        const isValidToken = await verifyCsrfToken(csrfToken);
        if (!isValidToken) {
          console.warn('Invalid CSRF token provided for signup');
          return createErrorResponse('Invalid security token. Please refresh and try again.', 403);
        }
      } catch (csrfError) {
        console.error('Error verifying CSRF token during signup:', csrfError);
        // Continue with signup despite CSRF error in production
        if (process.env.NODE_ENV === 'production') {
          return createErrorResponse('Security validation failed. Please refresh and try again.', 403);
        }
      }
    } else {
      console.warn('No CSRF token provided for signup');
      // In production, we would reject the request
      if (process.env.NODE_ENV === 'production') {
        return createErrorResponse('Security token missing. Please refresh and try again.', 403);
      }
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(email);
      if (userRecord) {
        return createErrorResponse('User with this email already exists', 400);
      }
    } catch (error) {
      // User does not exist, continue with creation
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user in Firebase Auth
    try {
      // Create user with Firebase client SDK
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(clientDb, 'users', firebaseUser.uid), {
        name,
        email,
        role: 'CUSTOMER', // Default role
        verificationToken,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // For the rest of this function, we'll use the user object
      const user = {
        id: firebaseUser.uid,
        name,
        email,
        role: 'CUSTOMER'
      };

      // Send verification email
      const emailOptions = generateVerificationEmail(email, verificationToken);
      await sendEmail(emailOptions);

      // Create JWT token
      const token = sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
        { expiresIn: '7d' }
      );

      // Create response with cookie
      const response = createApiResponse({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: 'Account created successfully',
      });

      // Set cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      // Return the response with cookie
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      return createErrorResponse(
        'Failed to create user',
        500,
        { details: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return createErrorResponse(
      'Failed to create account',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
