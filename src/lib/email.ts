// In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
// This is a mock implementation for demonstration purposes

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development, we'll just log the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('========== EMAIL SENT ==========');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Text: ${options.text}`);
    console.log(`HTML: ${options.html}`);
    console.log('===============================');
    return true;
  }

  try {
    // In production, you would use a real email service
    // Example with SendGrid:
    // const msg = {
    //   to: options.to,
    //   from: 'your-email@example.com',
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    // };
    // await sgMail.send(msg);

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateVerificationEmail(to: string, token: string): EmailOptions {
  // Use window.location.origin if available (client-side), otherwise use env var or fallback
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

  return {
    to,
    subject: 'Verify Your Email Address',
    text: `
      Thank you for signing up! Please verify your email address by clicking the link below:

      ${verificationUrl}

      If you did not sign up for an account, you can safely ignore this email.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Verify Your Email Address</h2>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
        <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">If you did not sign up for an account, you can safely ignore this email.</p>
      </div>
    `,
  };
}

export function generatePasswordResetEmail(to: string, token: string): EmailOptions {
  // Use window.location.origin if available (client-side), otherwise use env var or fallback
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  return {
    to,
    subject: 'Reset Your Password',
    text: `
      You requested a password reset. Please click the link below to reset your password:

      ${resetUrl}

      This link will expire in 1 hour.

      If you did not request a password reset, you can safely ignore this email.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Reset Your Password</h2>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
        <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };
}
