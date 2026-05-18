export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - Clexpay',
  description: 'Clexpay Cookie Policy - How we use cookies',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Cookie Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: April 24, 2026</p>

        <p className="text-gray-600 mb-6">
          This Cookie Policy explains how Clexpay uses cookies and similar technologies to recognize you when you visit our platform.
        </p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">What Are Cookies?</h2>
        <p className="text-gray-600 mb-4">
          Cookies are small data files placed on your device when you visit a website. They help remember your preferences, enable certain features, and analyze site traffic.
        </p>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Types of Cookies We Use</h2>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left font-semibold">Category</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">Purpose</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Essential</span></td>
                <td className="border border-gray-300 p-3 text-gray-600">Authenticate sessions, maintain security, prevent fraud. Cannot be disabled.</td>
                <td className="border border-gray-300 p-3 text-gray-600">Session / 24h</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">Functional</span></td>
                <td className="border border-gray-300 p-3 text-gray-600">Remember preferences, provide personalized experience</td>
                <td className="border border-gray-300 p-3 text-gray-600">30 days</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">Analytics</span></td>
                <td className="border border-gray-300 p-3 text-gray-600">Analyze usage, improve services, understand user behavior (anonymized)</td>
                <td className="border border-gray-300 p-3 text-gray-600">365 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Managing Cookies</h2>
        <p className="text-gray-600 mb-4">You can control cookies through:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
          <li><strong>Consent Banner:</strong> Accept or reject optional cookies on first visit</li>
          <li><strong>Opt-Out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-emerald-600 underline" target="_blank">Google Analytics Opt-Out</a></li>
        </ul>

        <h2 className="text-xl font-semibold text-emerald-700 mt-8 mb-4 border-b border-emerald-200 pb-2">Consequences of Disabling Cookies</h2>
        <p className="text-gray-600 mb-4">Disabling essential cookies will:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Log you out of your account</li>
          <li>Prevent secure transactions</li>
          <li>Disable fraud prevention</li>
        </ul>

        <div className="bg-emerald-50 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">Contact</h3>
          <p className="text-gray-600">dpo@clexpay.com</p>
        </div>
      </div>
    </div>
  );
}