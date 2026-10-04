import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { API_BASE_URL } from './utils/api';

// Intercept window.fetch globally to route relative /api requests to backend URL in production
if (API_BASE_URL) {
  console.log(`[API Interceptor] Routing /api requests to: ${API_BASE_URL}`);
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${API_BASE_URL}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api')) {
      input = new URL(`${API_BASE_URL}${input.pathname}${input.search}`);
    } else if (input instanceof Request) {
      const url = new URL(input.url, window.location.origin);
      if (url.pathname.startsWith('/api')) {
        input = new Request(`${API_BASE_URL}${url.pathname}${url.search}`, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
