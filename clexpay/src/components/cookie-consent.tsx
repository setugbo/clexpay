'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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
      setTimeout(() => setVisible(true), 2000);
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
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-emerald-100 rounded-lg">
            <Cookie className="w-5 h-5 text-emerald-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">We use cookies</h3>
              <button
                onClick={() => setVisible(false)}
                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Necessary for security. Optional cookies help us improve.
            </p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 mt-2"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'More'} details
            </button>

            {expanded && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Essential</span>
                  <span className="text-green-600">Required</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Analytics</span>
                  <span className="text-amber-600">Optional</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
              >
                Accept
              </button>
            </div>
            
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <a href="/policy/privacy" className="hover:text-emerald-600">Privacy</a>
              <a href="/policy/terms" className="hover:text-emerald-600">Terms</a>
              <a href="/policy/whistleblower" className="hover:text-emerald-600">Whistleblow</a>
            </div>
          </div>
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