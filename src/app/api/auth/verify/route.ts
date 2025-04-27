import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema
const verifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { token } = validation.data;

    // Find user with this verification token
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('verificationToken', '==', token).get();

    if (snapshot.empty) {
      return createErrorResponse('Invalid verification token', 400);
    }

    // Get the first matching user
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Update user to mark email as verified
    await usersRef.doc(userId).update({
      emailVerified: true,
      verificationToken: null,
      updatedAt: new Date()
    });

    return createApiResponse({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return createErrorResponse(
      'Failed to verify email',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
