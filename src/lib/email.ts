import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.clexpay.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'hello@clexpay.com',
    pass: process.env.EMAIL_PASSWORD || 'Inspire@2026',
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Clexpay" <${process.env.EMAIL_USER || 'hello@clexpay.com'}>`,
      to: email,
      subject: 'Your Clexpay Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Clexpay Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Clexpay</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Verify Your Email Address</p>
            </div>
            <div style="padding: 32px; text-align: center;">
              <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px 0;">Your verification code is:</p>
              <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; color: #10b981; letter-spacing: 8px;">${otp}</span>
              </div>
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">This code expires in 10 minutes.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your Clexpay verification code is: ${otp}. This code expires in 10 minutes.`,
    });
    console.log(`[EMAIL] OTP ${otp} sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send OTP:', error);
    return false;
  }
}

export async function sendTransactionEmail(
  email: string,
  details: {
    type: string;
    amount: string;
    currency: string;
    reference: string;
    status: string;
    cardCode?: string;
  }
): Promise<boolean> {
  try {
    const statusColor = details.status === 'success' ? '#10b981' : details.status === 'failed' ? '#ef4444' : '#f59e0b';
    const statusBg = details.status === 'success' ? '#d1fae5' : details.status === 'failed' ? '#fee2e2' : '#fef3c7';

    const cardCodeSection = details.cardCode ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Gift Card Code</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-family: monospace; color: #10b981;">${details.cardCode}</td>
      </tr>
    ` : '';

    await transporter.sendMail({
      from: `"Clexpay" <${process.env.EMAIL_USER || 'hello@clexpay.com'}>`,
      to: email,
      subject: `Transaction ${details.status === 'success' ? 'Confirmed' : 'Update'}: ${details.reference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transaction Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Clexpay</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Transaction Notification</p>
            </div>
            <div style="padding: 32px;">
              <div style="background: ${statusBg}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <p style="color: ${statusColor}; margin: 0; font-weight: 600; text-transform: uppercase; font-size: 14px;">${details.status}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Type</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${details.type}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${details.amount} ${details.currency}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280;">Reference</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; font-family: monospace;">${details.reference}</td>
                </tr>
                ${cardCodeSection}
              </table>
              ${details.cardCode ? `
              <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
                <p style="color: #047857; margin: 0 0 8px 0; font-weight: 600;">Your Gift Card Code</p>
                <p style="color: #10b981; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 4px;">${details.cardCode}</p>
              </div>
              ` : ''}
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Transaction ${details.status}: ${details.type} - ${details.amount} ${details.currency}. Reference: ${details.reference}`,
    });
    console.log(`[EMAIL] Transaction notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send transaction email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Clexpay" <${process.env.EMAIL_USER || 'hello@clexpay.com'}>`,
      to: email,
      subject: 'Welcome to Clexpay!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Clexpay</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Clexpay!</h1>
            </div>
            <div style="padding: 32px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Hello ${name},</p>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">Your account has been successfully created. You can now:</p>
              <div style="text-align: left; background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #374151; margin: 0 0 12px 0; font-weight: 600;">✅ Buy and sell cryptocurrency</p>
                <p style="color: #374151; margin: 0 0 12px 0; font-weight: 600;">✅ Pay bills instantly</p>
                <p style="color: #374151; margin: 0 0 12px 0; font-weight: 600;">✅ Buy gift cards</p>
                <p style="color: #374151; margin: 0; font-weight: 600;">✅ Send and receive money</p>
              </div>
              <a href="${process.env.NEXTAUTH_URL || 'https://clexpay.vercel.app'}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome ${name}! Your Clexpay account is ready. Get started at ${process.env.NEXTAUTH_URL || 'https://clexpay.vercel.app'}/dashboard`,
    });
    console.log(`[EMAIL] Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send welcome email:', error);
    return false;
  }
}

export default transporter;
