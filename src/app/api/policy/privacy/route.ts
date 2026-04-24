import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const policy = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Clexpay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 40px auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #10b981; font-size: 32px; margin-bottom: 16px; }
    h2 { color: #059669; font-size: 24px; margin: 32px 0 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
    h3 { color: #047857; font-size: 18px; margin: 24px 0 12px; }
    p, ul { margin-bottom: 16px; }
    li { margin-left: 24px; margin-bottom: 8px; }
    .last-updated { color: #666; font-size: 14px; margin-bottom: 32px; }
    .contact { background: #ecfdf5; padding: 24px; border-radius: 8px; margin-top: 32px; }
    .contact h3 { margin-top: 0; }
    a { color: #10b981; }
    @media (max-width: 600px) { .container { margin: 16px; padding: 24px; } h1 { font-size: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last Updated: April 24, 2026</p>

    <p>Clexpay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fintech platform.</p>

    <h2>Information We Collect</h2>
    
    <h3>Personal Information</h3>
    <ul>
      <li><strong>Account Data:</strong> Name, email address, phone number, date of birth</li>
      <li><strong>Verification:</strong> Government-issued ID, selfie for KYC compliance</li>
      <li><strong>Financial:</strong> Bank account details, wallet addresses, transaction history</li>
      <li><strong>Communication:</strong> Customer support tickets, email correspondence</li>
    </ul>

    <h3>Automatic Data</h3>
    <ul>
      <li><strong>Device:</strong> IP address, browser type, device identifiers</li>
      <li><strong>Usage:</strong> Pages visited, features used, session duration</li>
      <li><strong>Location:</strong> Approximate location from IP address</li>
    </ul>

    <h3>Third-Party Data</h3>
    <ul>
      <li><strong>Providers:</strong> KYC verification results from identity providers</li>
      <li><strong>Blockchain:</strong> Transaction data from public blockchains</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <ul>
      <li>Provide and maintain our services</li>
      <li>Process transactions (deposits, withdrawals, trades, bill payments)</li>
      <li>Verify identity and comply with KYC/AML regulations</li>
      <li>Send transaction notifications and account updates</li>
      <li>Improve our services and user experience</li>
      <li>Detect and prevent fraud, money laundering, and illegal activity</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h2>Information Sharing</h2>
    <p>We do NOT sell your personal information. We share data only with:</p>
    <ul>
      <li><strong>Service Providers:</strong> Payment processors, cloud hosting, email delivery</li>
      <li><strong>Legal Compliance:</strong> When required by law, court order, or regulatory authority</li>
      <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
    </ul>

    <h2>Data Security</h2>
    <ul>
      <li><strong>Encryption:</strong> All data in transit (TLS 1.3) and at rest (AES-256)</li>
      <li><strong>Authentication:</strong> Multi-factor authentication available</li>
      <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
      <li><strong>Access Control:</strong> Role-based access with least privilege principle</li>
    </ul>

    <h2>Data Retention</h2>
    <p>We retain personal data as long as your account is active, and for regulatory compliance periods after account closure (minimum 5 years for financial records).</p>

    <h2>Your Rights</h2>
    <ul>
      <li><strong>Access:</strong> Request a copy of your personal data</li>
      <li><strong>Correction:</strong> Request correction of inaccurate data</li>
      <li><strong>Deletion:</strong> Request deletion (subject to legal retention requirements)</li>
      <li><strong>Restriction:</strong> Request restriction of processing</li>
      <li><strong>Portability:</strong> Request data in machine-readable format</li>
      <li><strong>Withdrawal:</strong> Withdraw consent for optional processing</li>
    </ul>

    <h2>Cookie Policy</h2>
    <p>We use cookies to:</p>
    <ul>
      <li><strong>Essential:</strong> Authenticate sessions, prevent fraud</li>
      <li><strong>Functional:</strong> Remember preferences</li>
      <li><strong>Analytics:</strong> Analyze usage patterns (anonymized)</li>
    </ul>
    <p>You can manage cookies through browser settings.</p>

    <h2>Whistleblowing</h2>
    <p>We encourage reporting of:</p>
    <ul>
      <li>Data breaches or unauthorized access</li>
      <li>Privacy violations or mishandling of personal data</li>
      <li>Suspicious activity or security concerns</li>
      <li>Violations of our privacy policies</li>
    </ul>
    <p><strong>Report securely:</strong> Email security@clexpay.com with subject "WHISTLEBLOWER" or use our anonymous reporting portal at clexpay.com/whistleblower</p>
    <p>All reports are treated confidentially. Whistleblowers are protected from retaliation under applicable laws.</p>

    <h2>International Transfers</h2>
    <p>Your data may be transferred to servers outside your country. We ensure adequate protection through Standard Contractual Clauses or equivalent legal mechanisms.</p>

    <h2>Children's Privacy</h2>
    <p>Our services are not intended for individuals under 18. We do not knowingly collect data from children.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update this policy periodically. Material changes will be notified via email and prominent notice on our platform.</p>

    <div class="contact">
      <h3>Contact Us</h3>
      <p><strong>Data Protection Officer:</strong> dpo@clexpay.com</p>
      <p><strong>Security/Whistleblowing:</strong> security@clexpay.com</p>
      <p><strong>Address:</strong> AAAA Excel Plaza, Okpanam Road, Off Jowin Academy by Kingdom Hall, Asaba, Delta State, Nigeria</p>
      <p><strong>Phone:</strong> +2349069015623</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(policy, {
    headers: { 'Content-Type': 'text/html' },
  });
}