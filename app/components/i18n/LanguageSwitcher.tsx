'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { supportedLocales, localeNames, type Locale } from '@/lib/i18n/config';

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    setIsOpen(false);
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    // In a full implementation, you would trigger a re-render with new locale
    // For now, this is a basic structure
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        {localeNames[currentLocale]}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg z-20">
            {supportedLocales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-accent ${
                  currentLocale === locale ? 'bg-accent font-medium' : ''
                }`}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

