import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const terms = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Clexpay</title>
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
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; }
    .prohibited { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; }
    .contact { background: #ecfdf5; padding: 24px; border-radius: 8px; margin-top: 32px; }
    a { color: #10b981; }
    @media (max-width: 600px) { .container { margin: 16px; padding: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Terms of Service</h1>
    <p class="last-updated">Last Updated: April 24, 2026</p>

    <p>Welcome to Clexpay. By accessing and using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By creating a Clexpay account, registering, or using any of our services, you:</p>
    <ul>
      <li>Affirm that you are at least 18 years old</li>
      <li>Have the legal capacity to enter into binding contracts</li>
      <li>Agree to comply with these Terms and all applicable laws</li>
      <li>Accept our Privacy Policy and Cookie Policy</li>
    </ul>

    <h2>2. Account Registration & Verification</h2>
    <ul>
      <li>Provide accurate, current, and complete information</li>
      <li>Maintain and promptly update your account information</li>
      <li>Complete identity verification (KYC) as required</li>
      <li>Keep your login credentials secure and confidential</li>
      <li>Notify us immediately of any unauthorized access</li>
    </ul>

    <h2>3. Services We Provide</h2>
    <p>Clexpay offers the following services:</p>
    <ul>
      <li><strong>Wallet:</strong> Deposit and withdraw NGN</li>
      <li><strong>Crypto Trading:</strong> Buy and sell cryptocurrency (BTC, ETH, USDT)</li>
      <li><strong>Bill Payments:</strong> Airtime, data, electricity, cable TV</li>
      <li><strong>Gift Cards:</strong> Purchase digital gift cards</li>
    </ul>

    <div class="warning">
      <strong>Important:</strong> All transactions are final. Cryptocurrency and gift card transactions cannot be reversed. Please verify all details before confirming.
    </div>

    <h2>4. User Responsibilities</h2>
    <ul>
      <li>Use services only for lawful purposes</li>
      <li>Ensure sufficient wallet balance before transactions</li>
      <li>Review and confirm all transaction details</li>
      <li>Maintain adequate security measures</li>
      <li>Report suspicious activity promptly</li>
      <li>Comply with tax obligations in your jurisdiction</li>
    </ul>

    <h2>5. Prohibited Activities</h2>
    <div class="prohibited">
      You may NOT:
      <ul>
        <li>Use the platform for illegal purposes</li>
        <li>Engage in money laundering or terrorist financing</li>
        <li>Attempt to hack, reverse engineer, or disrupt services</li>
        <li>Use multiple accounts to bypass limits</li>
        <li>Engage in fraudulent transactions</li>
        <li>Resell our services without authorization</li>
        <li>Share account access with others</li>
      </ul>
    </div>

    <h2>6. Fees and Charges</h2>
    <ul>
      <li>Transaction fees are clearly displayed before confirmation</li>
      <li>Fees may vary by service type and amount</li>
      <li>All fees are non-refundable</li>
      <li>We reserve the right to modify fees with notice</li>
    </ul>

    <h2>7. Risk Disclosures</h2>
    <ul>
      <li><strong>Cryptocurrency:</strong> Highly volatile; values can drop significantly</li>
      <li><strong>No Guarantee:</strong> Past performance does not guarantee future results</li>
      <li><strong>Liquidity:</strong> Some assets may be illiquid</li>
      <li><strong>Technology:</strong> Technical failures may occur</li>
      <li><strong>Regulatory:</strong> Laws may change affecting services</li>
    </ul>

    <h2>8. Limitation of Liability</h2>
    <p>Clexpay is provided "as is" without warranties. We are not liable for:</p>
    <ul>
      <li>Indirect, incidental, or consequential damages</li>
      <li>Loss of profits, data, or opportunities</li>
      <li>Actions of third parties</li>
      <li>User negligence or error</li>
      <li>Force majeure events</li>
    </ul>

    <h2>9. Indemnification</h2>
    <p>You agree to indemnify and hold harmless Clexpay, its officers, directors, and employees from any claims, damages, losses, or expenses arising from:</p>
    <ul>
      <li>Your violation of these Terms</li>
      <li>Your use of our services</li>
      <li>Your illegal or wrongful conduct</li>
      <li>Claims by third parties related to you</li>
    </ul>

    <h2>10. Intellectual Property</h2>
    <p>All content, logos, trademarks, and technology are our property. You may not copy, modify, or distribute our proprietary materials without written consent.</p>

    <h2>11. Account Suspension & Termination</h2>
    <p>We may suspend or terminate your account if:</p>
    <ul>
      <li>Violation of these Terms</li>
      <li>Fraud, money laundering, or illegal activity</li>
      <li>Required by law or regulatory authority</li>
      <li>Inactivity for extended period</li>
      <li>Request by user (with proper verification)</li>
    </ul>

    <h2>12. Whistleblowing & Reporting</h2>
    <p>We encourage you to report:</p>
    <ul>
      <li>Security vulnerabilities or breaches</li>
      <li>Fraudulent activity</li>
      <li>Violation of these Terms by others</li>
      <li>Illegal use of the platform</li>
      <li>Insider trading or market manipulation</li>
    </ul>
    <p><strong>Report securely:</strong></p>
    <ul>
      <li>Email: security@clexpay.com (subject: WHISTLEBLOWER)</li>
      <li>Portal: clexpay.com/whistleblower</li>
      <li>Hotline: +2349069015623</li>
    </ul>
    <p>All reports are investigated. Whistleblowers are protected from retaliation. Reports may be anonymous.</p>

    <h2>13. Dispute Resolution</h2>
    <ul>
      <li>Contact us first for customer support</li>
      <li>Mediation before legal action</li>
      <li>Arbitration as final resort</li>
      <li>Governing law: Laws of Nigeria</li>
      <li>Jurisdiction: Delta State, Nigeria courts</li>
    </ul>

    <h2>14. Changes to Terms</h2>
    <p>We may modify these Terms. Material changes will be communicated via email and platform notice. Continued use constitutes acceptance.</p>

    <h2>15. Contact Information</h2>
    <div class="contact">
      <p><strong>Customer Support:</strong> support@clexpay.com</p>
      <p><strong>Security/Whistleblowing:</strong> security@clexpay.com</p>
      <p><strong>Address:</strong> AAAA Excel Plaza, Okpanam Road, Off Jowin Academy by Kingdom Hall, Asaba, Delta State, Nigeria</p>
      <p><strong>Phone:</strong> +2349069015623</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(terms, {
    headers: { 'Content-Type': 'text/html' },
  });
}