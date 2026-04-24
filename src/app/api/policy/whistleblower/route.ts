import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return new NextResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Whistleblower Policy - Clexpay</title>
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
    .protected { background: #dbeafe; border: 2px solid #3b82f6; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .protected ul { list-style: none; margin-left: 0; }
    .protected li::before { content: "✓ "; color: #3b82f6; font-weight: bold; }
    .report-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .anonymous { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .confidential { background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .contact { background: #fee2e2; padding: 24px; border-radius: 8px; margin-top: 32px; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 8px 0; }
    .btn:hover { background: #047857; }
    a { color: #10b981; }
    @media (max-width: 600px) { .container { margin: 16px; padding: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Whistleblower Policy</h1>
    <p class="last-updated">Effective Date: April 24, 2026</p>

    <p>Clexpay is committed to maintaining the highest standards of integrity, transparency, and ethical conduct. We encourage employees, contractors, partners, and users to report concerns about misconduct without fear of retaliation.</p>

    <h2>1. Purpose</h2>
    <p>This policy ensures:</p>
    <ul>
      <li>Safe and confidential reporting channels</li>
      <li>Investigation of all reports</li>
      <li>Protection from retaliation for good-faith reporters</li>
      <li>Compliance with legal requirements</li>
    </ul>

    <h2>2. What to Report</h2>
    <p>Report any of the following:</p>
    <ul>
      <li><strong>Security:</strong> Data breaches, unauthorized access, cyber attacks</li>
      <li><strong>Fraud:</strong> Embezzlement, misappropriation, financial fraud</li>
      <li><strong>Privacy:</strong> Unauthorized data collection, sale, or disclosure</li>
      <li><strong>Harassment:</strong> Workplace harassment, discrimination</li>
      <li><strong>Misconduct:</strong> Violation of policies or laws</li>
      <li><strong>Unsafe Practices:</strong> Products or services causing harm</li>
      <li><strong>Insider Trading:</strong> Trading on non-public information</li>
      <li><strong>Market Manipulation:</strong> Price manipulation, fake volume</li>
      <li><strong>Money Laundering:</strong> Suspected illegal fund transfers</li>
      <li><strong>Bribery:</strong> Corruption, kickbacks, improper gifts</li>
      <li><strong>Theft:</strong> Intellectual property, customer data</li>
      <li><strong>Regulatory:</strong> Non-compliance with financial regulations</li>
    </ul>

    <h2>3. How to Report</h2>

    <div class="report-box">
      <h3>Reporting Channels (Order of Preference)</h3>
      <ol>
        <li><strong>Secure Portal:</strong> clexpay.com/whistleblower (anonymous form)</li>
        <li><strong>Email:</strong> security@clexpay.com (Subject: WHISTLEBLOWER)</li>
        <li><strong>Hotline:</strong> +2349069015623 (24/7 voicemail)</li>
        <li><strong>Mail:</strong> Clexpay Security Team (confidential)</li>
      </ol>
    </div>

    <h2>4. Anonymous Reporting</h2>
    <div class="anonymous">
      <h3>You Can Report Anonymously</h3>
      <ul>
        <li>Use our secure online portal without providing personal details</li>
        <li>Create a pseudo-anonymous account</li>
        <li>Provide only information necessary for investigation</li>
        <li>Use a secure, private connection</li>
        <li>Avoid giving identifying details about yourself</li>
      </ul>
    </div>

    <h2>5. Confidentiality</h2>
    <div class="confidential">
      <ul>
        <li>All reports are treated as CONFIDENTIAL</li>
        <li>Access limited to Security Team/Board</li>
        <li>No disclosure without need-to-know</li>
        <li>Documents stored encrypted</li>
        <li>Investigators sign NDAs</li>
      </ul>
    </div>

    <h2>6. Protection from Retaliation</h2>
    <div class="protected">
      <h3>You Are Protected</h3>
      <ul>
        <li>No adverse action for good-faith reports</li>
        <li>Your identity protected to the fullest extent legally possible</li>
        <li>No termination, demotion, or harassment</li>
        <li>Threats of retaliation are also violations</li>
        <li>We comply with all applicable whistleblower protection laws</li>
      </ul>
    </div>

    <h2>7. What Happens After Reporting</h2>
    <ul>
      <li><strong>Acknowledgment:</strong> Within 24 hours (if contact provided)</li>
      <li><strong>Assessment:</strong> Initial review within 5 business days</li>
      <li><strong>Investigation:</strong> Conducted by independent team</li>
      <li><strong>Updates:</strong> Progress communicated periodically</li>
      <li><strong>Resolution:</strong> Findings and actions documented</li>
      <li><strong>Feedback:</strong> Outcome shared (respecting confidentiality)</li>
    </ul>

    <h2>8. Investigation Process</h2>
    <ol>
      <li><strong>Triage:</strong> Assess severity and type of report</li>
      <li><strong>Assignment:</strong> Independent investigators assigned</li>
      <li><strong>Evidence:</strong> Collect relevant documentation</li>
      <li><strong>Interviews:</strong> Speak with relevant parties</li>
      <li><strong>Analysis:</strong> Review findings</li>
      <li><strong>Action:</strong> Determine corrective measures</li>
      <li><strong>Closure:</strong> Document outcome</li>
    </ol>

    <h2>9. False Reports</h2>
    <p>Knowingly false reports (misuse of policy) may result in:</p>
    <ul>
      <li>Exclusion from future reporting channels</li>
      <li>Disciplinary action (if employee)</li>
      <li>Potential legal consequences</li>
    </ul>

    <h2>10. Additional Resources</h2>
    <ul>
      <li>SEC (Securities & Exchange Commission)</li>
      <li>CBN (Central Bank of Nigeria)</li>
      <li>EFCC (Economic & Financial Crimes Commission)</li>
      <li>NDPC (Nigeria Data Protection Commission)</li>
    </ul>

    <h2>11. Other Reporting Channels</h2>
    <p>If you prefer external reporting:</p>
    <ul>
      <li><strong>SEC Nigeria:</strong> sec.gov.ng</li>
      <li><strong>CBN:</strong> cbn.gov.ng</li>
      <li><strong>NDPC:</strong> ndpc.gov.ng</li>
      <li><strong>EFCC:</strong> efcc.gov.ng</li>
    </ul>

    <h2>12. Questions?</h2>
    <div class="contact">
      <p>Contact our Chief Compliance Officer: compliance@clexpay.com</p>
      <p>Phone: +2349069015623</p>
      <p>For immediate threats, contact law enforcement.</p>
      <a href="clexpay.com/whistleblower" class="btn">Submit Secure Report</a>
    </div>
  </div>
</body>
</html>
  `.trim(), {
    headers: { 'Content-Type': 'text/html' },
  });
}