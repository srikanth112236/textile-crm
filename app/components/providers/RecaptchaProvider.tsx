'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ReactNode } from 'react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export function RecaptchaProvider({ children }: { children: ReactNode }) {
  // Always render the provider if we have a site key
  // If no site key, still render provider with empty string (it will handle it gracefully)
  // This ensures the hook can be called without errors
  if (!RECAPTCHA_SITE_KEY) {
    // No site key - just render children (reCAPTCHA won't work, but that's OK for dev)
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: 'head',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
