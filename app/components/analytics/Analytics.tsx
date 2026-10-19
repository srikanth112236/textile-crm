'use client';

import Script from 'next/script';
import { useReportWebVitals } from 'next/web-vitals';
import { GA_ID, PIXEL_ID, track } from '@/lib/analytics';

// Lazy-loads GA4 + Meta Pixel only when IDs are configured (zero cost otherwise).
// Also reports Core Web Vitals to GA as custom events for the performance budget.
export function Analytics() {
  useReportWebVitals((metric) => {
    if (GA_ID && typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[web-vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`);
    }
    // Fire-and-forget beacon for server-side CWV log (4G performance budget)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';
      const payload = JSON.stringify({ name: metric.name, value: metric.value, rating: metric.rating, path: window.location.pathname });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${apiUrl}/api/analytics/web-vitals`, new Blob([payload], { type: 'application/json' }));
      }
    } catch {
      // ignore
    }
  });

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {PIXEL_ID && (
        <>
          <Script id="fb-pixel" strategy="lazyOnload">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
    </>
  );
}

export { track };
