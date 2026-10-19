'use client';

import { useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export const useRecaptcha = () => {
  // Try to get the hook - will be undefined if provider is not available
  let executeRecaptcha: ((action?: string) => Promise<string>) | undefined;
  
  try {
    const { executeRecaptcha: exec } = useGoogleReCaptcha();
    executeRecaptcha = exec;
  } catch (error) {
    // Provider not available - this is OK for development
    executeRecaptcha = undefined;
  }

  const getRecaptchaToken = useCallback(async (): Promise<string | null> => {
    // If reCAPTCHA is not configured or provider is not available, return null
    // Backend will skip verification in development mode
    if (!executeRecaptcha) {
      return null;
    }

    try {
      const token = await executeRecaptcha('submit');
      return token;
    } catch (error) {
      // Failed to generate token - return null silently
      return null;
    }
  }, [executeRecaptcha]);

  return { getRecaptchaToken };
};
