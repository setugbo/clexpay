export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Clexpay',
  description: 'Clexpay Privacy Policy - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: April 24, 2026</p>

        <p className="text-gray-600 mb-6">
          Clexpay (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fintech platform.
        </p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Information We Collect</h2>
        
        <h3 className="text-lg font-medium text-emerald-800 mt-4 mb-2">Personal Information</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Account Data:</strong> Name, email address, phone number, date of birth</li>
          <li><strong>Verification:</strong> Government-issued ID, selfie for KYC compliance</li>
          <li><strong>Financial:</strong> Bank account details, wallet addresses, transaction history</li>
          <li><strong>Communication:</strong> Customer support tickets, email correspondence</li>
        </ul>

        <h3 className="text-lg font-medium text-emerald-800 mt-4 mb-2">Automatic Data</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Device:</strong> IP address, browser type, device identifiers</li>
          <li><strong>Usage:</strong> Pages visited, features used, session duration</li>
          <li><strong>Location:</strong> Approximate location from IP address</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Provide and maintain our services</li>
          <li>Process transactions (deposits, withdrawals, trades, bill payments)</li>
          <li>Verify identity and comply with KYC/AML regulations</li>
          <li>Send transaction notifications and account updates</li>
          <li>Improve our services and user experience</li>
          <li>Detect and prevent fraud, money laundering, and illegal activity</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Information Sharing</h2>
        <p className="text-gray-600 mb-2">We do NOT sell your personal information. We share data only with:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Service Providers:</strong> Payment processors, cloud hosting, email delivery</li>
          <li><strong>Legal Compliance:</strong> When required by law, court order, or regulatory authority</li>
          <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Data Security</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Encryption:</strong> All data in transit (TLS 1.3) and at rest (AES-256)</li>
          <li><strong>Authentication:</strong> Multi-factor authentication available</li>
          <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
          <li><strong>Access Control:</strong> Role-based access with least privilege principle</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Your Rights</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion (subject to legal retention requirements)</li>
          <li><strong>Portability:</strong> Request data in machine-readable format</li>
          <li><strong>Withdrawal:</strong> Withdraw consent for optional processing</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Whistleblowing</h2>
        <p className="text-gray-600 mb-2">We encourage reporting of:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Data breaches or unauthorized access</li>
          <li>Privacy violations or mishandling of personal data</li>
          <li>Suspicious activity or security concerns</li>
          <li>Violations of our privacy policies</li>
        </ul>
        <p className="text-gray-600 mb-2"><strong>Report securely:</strong> Email security@clexpay.com with subject &quot;WHISTLEBLOWER&quot;</p>

        <div className="bg-emerald-50 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">Contact Us</h3>
          <p className="text-gray-600"><strong>Data Protection Officer:</strong> dpo@clexpay.com</p>
          <p className="text-gray-600"><strong>Security/Whistleblowing:</strong> security@clexpay.com</p>
          <p className="text-gray-600"><strong>Address:</strong> AAAA Excel Plaza, Okpanam Road, Off Jowin Academy by Kingdom Hall, Asaba, Delta State, Nigeria</p>
          <p className="text-gray-600"><strong>Phone:</strong> +2349069015623</p>
        </div>
      </div>
    </div>
  );
}