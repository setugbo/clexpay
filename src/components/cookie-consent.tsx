'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
    onDecline?.();
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Cookie className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cookie Preferences</h2>
            <p className="text-sm text-gray-500">We value your privacy</p>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          We use cookies to enhance your experience, analyze site traffic, and for security. 
          Essential cookies are required for the platform to work.
        </p>

        <div className="mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide' : 'Show'} cookie details
          </button>

          {expanded && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Essential</span>
                <span className="text-green-600">Required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analytics</span>
                <span className="text-amber-600">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Functional</span>
                <span className="text-amber-600">Optional</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            Decline Optional
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Accept All
          </Button>
        </div>

        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <a href="/policy/privacy" className="hover:text-emerald-600">Privacy Policy</a>
          <a href="/policy/terms" className="hover:text-emerald-600">Terms of Service</a>
          <a href="/policy/cookies" className="hover:text-emerald-600">Cookie Policy</a>
        </div>
      </div>
    </div>
  );
}

export function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem('cookie_consent');
  return consent === 'accepted';
}

export function getCookieConsentDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cookie_consent_date');
}