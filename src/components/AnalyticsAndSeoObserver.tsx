// src/components/AnalyticsAndSeoObserver.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveRouteSeo, applySeoToDocument } from '../utils/seo';
import {
  initGA4,
  trackPageView,
  subscribeAnalyticsConsent,
} from '../services/analytics';

/**
 * Route-aware SEO & GA4 PageView Observer.
 * - Updates <title>, <meta name="description">, <meta name="robots">, <link rel="canonical">,
 *   Open Graph, Twitter Card, and Schema.org JSON-LD on every SPA navigation.
 * - Emits GA4 `page_view` when consent is granted and route is not `/admin/*`.
 */
export const AnalyticsAndSeoObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const seo = resolveRouteSeo({
      pathname: location.pathname,
      search: location.search,
    });
    applySeoToDocument(seo);

    initGA4(location.pathname);
    trackPageView({
      path: location.pathname,
      search: location.search,
      title: seo.title,
    });
  }, [location.pathname, location.search]);

  // If user grants consent while on the current page, initialize GA4 and record the current page view
  useEffect(() => {
    return subscribeAnalyticsConsent((state) => {
      if (state === 'granted') {
        const seo = resolveRouteSeo({
          pathname: location.pathname,
          search: location.search,
        });
        initGA4(location.pathname);
        trackPageView({
          path: location.pathname,
          search: location.search,
          title: seo.title,
        });
      }
    });
  }, [location.pathname, location.search]);

  return null;
};
