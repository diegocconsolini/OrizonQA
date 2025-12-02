/**
 * Email Utility
 *
 * Handles all email sending functionality for ORIZON authentication.
 * Uses Resend for reliable email delivery.
 *
 * Functions:
 * - sendVerificationEmail: Send 6-digit verification code
 * - sendPasswordResetEmail: Send password reset link
 */

import { Resend } from 'resend';

let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send verification email with 6-digit code
 *
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @param {string} verificationCode - 6-digit verification code
 * @returns {Promise<object>} Resend response
 */
export async function sendVerificationEmail(email, fullName, verificationCode) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0A0A0A;
      color: #E5E5E5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #00D4FF;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 0;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #FFFFFF;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #B3B3B3;
      margin-bottom: 30px;
    }
    .code-container {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(106, 0, 255, 0.05) 100%);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 12px;
    }
    .code-label {
      font-size: 14px;
      color: #B3B3B3;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code {
      font-size: 48px;
      font-weight: 700;
      color: #00D4FF;
      letter-spacing: 8px;
      font-family: 'JetBrains Mono', monospace;
      text-align: center;
      margin: 10px 0;
    }
    .expiry {
      font-size: 14px;
      color: #FF9500;
      margin-top: 20px;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #666666;
      font-size: 14px;
    }
    .tagline {
      color: #00D4FF;
      font-weight: 600;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ORIZON</div>
    </div>

    <div class="content">
      <div class="greeting">Hi ${fullName},</div>

      <div class="message">
        Welcome to ORIZON! To complete your account setup, please verify your email address using the code below.
      </div>

      <div class="code-container">
        <div class="code-label">Your Verification Code</div>
        <div class="code">${verificationCode}</div>
      </div>

      <div class="expiry">
        ⏱ This code expires in 10 minutes
      </div>

      <div class="message" style="margin-top: 30px;">
        If you didn't create an ORIZON account, you can safely ignore this email.
      </div>
    </div>

    <div class="footer">
      <div>ORIZON</div>
      <div class="tagline">AI-Powered QA Analysis</div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    console.log('[EMAIL] Attempting to send verification email to:', email);
    console.log('[EMAIL] Using Resend API key:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');

    const resendClient = getResendClient();
    if (!resendClient) {
      throw new Error('Resend API key not configured');
    }

    const response = await resendClient.emails.send({
      from: 'ORIZON <orizon@diegocon.nl>',
      to: email,
      subject: 'Verify your ORIZON account',
      html: htmlContent,
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    console.error('[EMAIL] Error details:', JSON.stringify(error, null, 2));
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email with secure token link
 *
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @param {string} resetToken - Secure reset token (UUID)
 * @returns {Promise<object>} Resend response
 */
export async function sendPasswordResetEmail(email, fullName, resetToken) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0A0A0A;
      color: #E5E5E5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #00D4FF;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 0;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #FFFFFF;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #B3B3B3;
      margin-bottom: 30px;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .reset-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%);
      color: #000000;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      transition: all 0.3s ease;
    }
    .reset-button:hover {
      box-shadow: 0 0 40px rgba(0, 212, 255, 0.5);
    }
    .expiry {
      font-size: 14px;
      color: #FF9500;
      margin-top: 30px;
      text-align: center;
    }
    .security-note {
      margin-top: 40px;
      padding: 20px;
      background: rgba(255, 149, 0, 0.05);
      border: 1px solid rgba(255, 149, 0, 0.2);
      border-radius: 8px;
      font-size: 14px;
      color: #B3B3B3;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #666666;
      font-size: 14px;
    }
    .tagline {
      color: #00D4FF;
      font-weight: 600;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ORIZON</div>
    </div>

    <div class="content">
      <div class="greeting">Hi ${fullName},</div>

      <div class="message">
        We received a request to reset your ORIZON account password. Click the button below to create a new password.
      </div>

      <div class="button-container">
        <a href="${resetUrl}" class="reset-button">Reset Password</a>
      </div>

      <div class="expiry">
        ⏱ This link expires in 1 hour
      </div>

      <div class="security-note">
        <strong>Security tip:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      </div>

      <div class="message" style="margin-top: 30px; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #00D4FF; word-break: break-all;">${resetUrl}</span>
      </div>
    </div>

    <div class="footer">
      <div>ORIZON</div>
      <div class="tagline">AI-Powered QA Analysis</div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      throw new Error('Resend API key not configured');
    }

    const response = await resendClient.emails.send({
      from: 'ORIZON <orizon@diegocon.nl>',
      to: email,
      subject: 'Reset your ORIZON password',
      html: htmlContent,
    });

    return response;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
