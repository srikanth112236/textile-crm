'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">Cookie Consent</CardTitle>
              <CardDescription className="mt-2">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                By clicking &quot;Accept&quot;, you consent to our use of cookies.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAccept} className="flex-1">
              Accept All Cookies
            </Button>
            <Button onClick={handleDecline} variant="outline" className="flex-1">
              Decline
            </Button>
            <Button
              onClick={() => {
                // Open privacy settings (can be implemented later)
                handleAccept();
              }}
              variant="ghost"
              className="flex-1"
            >
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

