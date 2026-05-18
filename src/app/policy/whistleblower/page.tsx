export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Whistleblower Policy - Clexpay',
  description: 'Clexpay Whistleblower Policy - How to report concerns confidentially',
};

export default function WhistleblowerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Whistleblower Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Effective Date: April 24, 2026</p>

        <p className="text-gray-600 mb-6">
          Clexpay is committed to maintaining the highest standards of integrity, transparency, and ethical conduct. We encourage employees, contractors, partners, and users to report concerns about misconduct without fear of retaliation.
        </p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">What to Report</h2>
        <p className="text-gray-600 mb-2">Report any of the following:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Security:</strong> Data breaches, unauthorized access, cyber attacks</li>
          <li><strong>Fraud:</strong> Embezzlement, misappropriation, financial fraud</li>
          <li><strong>Privacy:</strong> Unauthorized data collection, sale, or disclosure</li>
          <li><strong>Harassment:</strong> Workplace harassment, discrimination</li>
          <li><strong>Misconduct:</strong> Violation of policies or laws</li>
          <li><strong>Insider Trading:</strong> Trading on non-public information</li>
          <li><strong>Market Manipulation:</strong> Price manipulation, fake volume</li>
          <li><strong>Money Laundering:</strong> Suspected illegal fund transfers</li>
          <li><strong>Bribery:</strong> Corruption, kickbacks, improper gifts</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">How to Report</h2>
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg my-4">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">Reporting Channels</h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li><strong>Secure Portal:</strong> clexpay.com/policy/whistleblower (anonymous form)</li>
            <li><strong>Email:</strong> security@clexpay.com (Subject: WHISTLEBLOWER)</li>
            <li><strong>Hotline:</strong> +2349069015623 (24/7 voicemail)</li>
            <li><strong>Mail:</strong> Clexpay Security Team (confidential)</li>
          </ol>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Anonymous Reporting</h2>
        <div className="bg-gray-100 p-4 rounded-lg my-4">
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Use our secure online portal without providing personal details</li>
            <li>Create a pseudo-anonymous account</li>
            <li>Provide only information necessary for investigation</li>
            <li>Use a secure, private connection</li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Protection from Retaliation</h2>
        <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg my-4">
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>No adverse action for good-faith reports</li>
            <li>Your identity protected to the fullest extent legally possible</li>
            <li>No termination, demotion, or harassment</li>
            <li>Threats of retaliation are also violations</li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">What Happens After Reporting</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>Acknowledgment:</strong> Within 24 hours (if contact provided)</li>
          <li><strong>Assessment:</strong> Initial review within 5 business days</li>
          <li><strong>Investigation:</strong> Conducted by independent team</li>
          <li><strong>Updates:</strong> Progress communicated periodically</li>
          <li><strong>Resolution:</strong> Findings and actions documented</li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">External Reporting Channels</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li><strong>SEC Nigeria:</strong> sec.gov.ng</li>
          <li><strong>CBN:</strong> cbn.gov.ng</li>
          <li><strong>NDPC:</strong> ndpc.gov.ng</li>
          <li><strong>EFCC:</strong> efcc.gov.ng</li>
        </ul>

        <div className="bg-red-50 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Questions?</h3>
          <p className="text-gray-600">Contact our Chief Compliance Officer: compliance@clexpay.com</p>
          <p className="text-gray-600">Phone: +2349069015623</p>
          <p className="text-gray-600 mt-2">For immediate threats, contact law enforcement.</p>
        </div>
      </div>
    </div>
  );
}