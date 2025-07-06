import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const users = await sql`
      SELECT id, name FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expires = ${resetExpires}
      WHERE id = ${user.id}
    `;

    // In a real application, you would send an email here
    // For now, we'll just return success
    console.log(`Password reset link for ${email}: https://reslifecal.vercel.app/reset-password?token=${resetToken}`);

    return res.status(200).json({ 
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Remove this in production - only for testing
      resetLink: `https://reslifecal.vercel.app/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}