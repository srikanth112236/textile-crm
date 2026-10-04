// API Base URL helper for Frontend
// Automatically points to VITE_API_URL if configured, or default Render backend URL when hosted on Render static site

export const API_BASE_URL =
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && window.location.hostname.includes('frontend')
      ? 'https://textile-crm-backend.onrender.com'
      : '';

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
