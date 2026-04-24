import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookiePolicy = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cookie Policy - Clexpay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 40px auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #10b981; font-size: 32px; margin-bottom: 16px; }
    h2 { color: #059669; font-size: 24px; margin: 32px 0 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
    h3 { color: #047857; font-size: 18px; margin: 24px 0 12px; }
    p, li { margin-bottom: 12px; }
    li { margin-left: 24px; }
    .last-updated { color: #666; font-size: 14px; margin-bottom: 32px; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table th, .table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
    .table th { background: #f3f4f6; font-weight: 600; }
    .table tr:nth-child(even) { background: #f9fafb; }
    .essential { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .analytics { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .functional { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .contact { background: #ecfdf5; padding: 24px; border-radius: 8px; margin-top: 32px; }
    a { color: #10b981; }
    @media (max-width: 600px) { .container { margin: 16px; padding: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Cookie Policy</h1>
    <p class="last-updated">Last Updated: April 24, 2026</p>

    <p>This Cookie Policy explains how Clexpay uses cookies and similar technologies to recognize you when you visit our platform.</p>

    <h2>What Are Cookies?</h2>
    <p>Cookies are small data files placed on your device when you visit a website. They help remember your preferences, enable certain features, and analyze site traffic.</p>

    <h2>Types of Cookies We Use</h2>

    <table class="table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Purpose</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="essential">Essential</span></td>
          <td>Authenticate sessions, maintain security, prevent fraud. Cannot be disabled.</td>
          <td>Session / 24h</td>
        </tr>
        <tr>
          <td><span class="functional">Functional</span></td>
          <td>Remember preferences, provide personalized experience</td>
          <td>30 days</td>
        </tr>
        <tr>
          <td><span class="analytics">Analytics</span></td>
          <td>Analyze usage, improve services, understand user behavior (anonymized)</td>
          <td>365 days</td>
        </tr>
      </tbody>
    </table>

    <h2>Specific Cookies We Use</h2>

    <table class="table">
      <thead>
        <tr>
          <th>Cookie Name</th>
          <th>Type</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>__Secure-next-auth.session-token</td>
          <td>Essential</td>
          <td>Maintain authenticated session</td>
        </tr>
        <tr>
          <td>csrf_token</td>
          <td>Essential</td>
          <td>Prevent cross-site request forgery</td>
        </tr>
        <tr>
          <td>preferences</td>
          <td>Functional</td>
          <td>Store UI preferences (language, theme)</td>
        </tr>
        <tr>
          <td>_ga, _gid</td>
          <td>Analytics</td>
          <td>Google Analytics (anonymized user ID, page views)</td>
        </tr>
        <tr>
          <td>tracking_consent</td>
          <td>Functional</td>
          <td>Remember cookie consent choice</td>
        </tr>
      </tbody>
    </table>

    <h2>Third-Party Cookies</h2>
    <p>We use trusted third-party services:</p>
    <ul>
      <li><strong>NextAuth.js:</strong> Authentication (our own)</li>
      <li><strong>Google Analytics:</strong> Anonymized usage analytics</li>
      <li><strong>Payment Processors:</strong> Flutterwave for transactions</li>
      <li><strong>Crypto APIs:</strong> Tatum for crypto data</li>
    </ul>
    <p>Third parties have their own privacy policies.</p>

    <h2>Managing Cookies</h2>
    <p>You can control cookies through:</p>
    <ul>
      <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
      <li><strong>Consent Banner:</strong> Accept or reject optional cookies on first visit</li>
      <li><strong>Opt-Out:</strong> Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank">https://tools.google.com/dlpage/gaoptout</a></li>
    </ul>

    <h2>Consequences of Disabling Cookies</h2>
    <p>Disabling essential cookies will:</p>
    <ul>
      <li>Log you out of your account</li>
      <li>Prevent secure transactions</li>
      <li>Disable fraud prevention</li>
    </ul>
    <p>Disabling analytics helps us improve but won't affect functionality.</p>

    <h2>Updates to This Policy</h2>
    <p>We may update this policy. The date above shows the latest revision. Material changes will be communicated.</p>

    <h2>Questions?</h2>
    <div class="contact">
      <p>Contact: dpo@clexpay.com</p>
      <p>Whistleblowing: security@clexpay.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(cookiePolicy, {
    headers: { 'Content-Type': 'text/html' },
  });
}