export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Clexpay',
  description: 'Clexpay Terms of Service - User agreement and responsibilities',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: April 24, 2026</p>

        <p className="text-gray-600 mb-6">
          Welcome to Clexpay. By accessing and using our platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
        </p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">1. Acceptance of Terms</h2>
        <p className="text-gray-600 mb-4">By creating a Clexpay account, registering, or using any of our services, you:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Affirm that you are at least 18 years old</li>
          <li>Have the legal capacity to enter into binding contracts</li>
          <li>Agree to comply with these Terms and all applicable laws</li>
          <li>Accept our Privacy Policy and Cookie Policy</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">2. Account Registration & Verification</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and promptly update your account information</li>
          <li>Complete identity verification (KYC) as required</li>
          <li>Keep your login credentials secure and confidential</li>
          <li>Notify us immediately of any unauthorized access</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">3. Services We Provide</h2>
        <p className="text-gray-600 mb-2">Clexpay offers the following services:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Wallet:</strong> Deposit and withdraw NGN</li>
          <li><strong>Crypto Trading:</strong> Buy and sell cryptocurrency (BTC, ETH, USDT)</li>
          <li><strong>Bill Payments:</strong> Airtime, data, electricity, cable TV</li>
          <li><strong>Gift Cards:</strong> Purchase digital gift cards</li>
        </ul>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
          <p className="text-amber-800 font-medium">Important: All transactions are final. Cryptocurrency and gift card transactions cannot be reversed. Please verify all details before confirming.</p>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">4. Prohibited Activities</h2>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <p className="text-red-800 font-medium mb-2">You may NOT:</p>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            <li>Use the platform for illegal purposes</li>
            <li>Engage in money laundering or terrorist financing</li>
            <li>Attempt to hack, reverse engineer, or disrupt services</li>
            <li>Use multiple accounts to bypass limits</li>
            <li>Engage in fraudulent transactions</li>
            <li>Share account access with others</li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">5. Fees and Charges</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Transaction fees are clearly displayed before confirmation</li>
          <li>Fees may vary by service type and amount</li>
          <li>All fees are non-refundable</li>
          <li>We reserve the right to modify fees with notice</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">6. Risk Disclosures</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Cryptocurrency:</strong> Highly volatile; values can drop significantly</li>
          <li><strong>No Guarantee:</strong> Past performance does not guarantee future results</li>
          <li><strong>Technology:</strong> Technical failures may occur</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">7. Whistleblowing & Reporting</h2>
        <p className="text-gray-600 mb-2">We encourage you to report:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Security vulnerabilities or breaches</li>
          <li>Fraudulent activity</li>
          <li>Violation of these Terms by others</li>
          <li>Illegal use of the platform</li>
        </ul>
        <p className="text-gray-600 mb-4"><strong>Report:</strong> security@clexpay.com (Subject: WHISTLEBLOWER)</p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">8. Contact Information</h2>
        <div className="bg-emerald-50 p-6 rounded-lg mt-4">
          <p className="text-gray-600"><strong>Customer Support:</strong> support@clexpay.com</p>
          <p className="text-gray-600"><strong>Security:</strong> security@clexpay.com</p>
          <p className="text-gray-600"><strong>Address:</strong> AAAA Excel Plaza, Okpanam Road, Off Jowin Academy by Kingdom Hall, Asaba, Delta State, Nigeria</p>
          <p className="text-gray-600"><strong>Phone:</strong> +2349069015623</p>
        </div>
      </div>
    </div>
  );
}