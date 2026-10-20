/**
 * Configuration and Endpoint Resolver for ATS Imposition (MyDraw).
 * Supports local development, production dedicated subdomain, custom overrides,
 * and handles unconfigured states cleanly without exposing secrets.
 */

export interface ImpositionServiceConfig {
  url: string;
  isConfigured: boolean;
  environment: 'development' | 'production' | 'custom' | 'unconfigured';
  source: 'env' | 'localStorage' | 'default' | 'none';
  statusDescription: string;
}

export const DEFAULT_IMPOSITION_DEV_PORT = 5173;
export const DEFAULT_IMPOSITION_DEV_URL = `http://localhost:${DEFAULT_IMPOSITION_DEV_PORT}`;
export const RECOMMENDED_PROD_SUBDOMAIN = 'https://imposition.atstech.com';
export const STORAGE_CUSTOM_URL_KEY = 'ats_custom_imposition_url';

/**
 * Resolves the active ATS Imposition endpoint URL.
 * Order of priority:
 * 1. User/operator custom override in browser localStorage (for local multi-port testing)
 * 2. NEXT_PUBLIC_IMPOSITION_URL environment variable
 * 3. In development mode (NODE_ENV !== 'production'), defaults to http://localhost:5173
 * 4. Otherwise returns unconfigured
 */
export function getImpositionConfig(): ImpositionServiceConfig {
  let customUrl: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      customUrl = window.localStorage.getItem(STORAGE_CUSTOM_URL_KEY);
      if (customUrl) {
        customUrl = customUrl.trim();
      }
    } catch {
      // localStorage may be unavailable in some private browsing contexts
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_IMPOSITION_URL?.trim();

  if (customUrl) {
    return {
      url: customUrl,
      isConfigured: true,
      environment: 'custom',
      source: 'localStorage',
      statusDescription: `Custom operator override active (${customUrl})`,
    };
  }

  if (envUrl && envUrl.length > 0) {
    const isDev = envUrl.includes('localhost') || envUrl.includes('127.0.0.1');
    return {
      url: envUrl,
      isConfigured: true,
      environment: isDev ? 'development' : 'production',
      source: 'env',
      statusDescription: isDev ? 'Local development server' : 'Production dedicated subdomain',
    };
  }

  // Fallback in development mode
  if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    return {
      url: DEFAULT_IMPOSITION_DEV_URL,
      isConfigured: true,
      environment: 'development',
      source: 'default',
      statusDescription: `Development fallback active (${DEFAULT_IMPOSITION_DEV_URL})`,
    };
  }

  return {
    url: '',
    isConfigured: false,
    environment: 'unconfigured',
    source: 'none',
    statusDescription: 'Endpoint not configured. Set NEXT_PUBLIC_IMPOSITION_URL.',
  };
}

/**
 * Persists a custom endpoint URL in browser localStorage for testing.
 */
export function setCustomImpositionUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (url && url.trim().length > 0) {
      window.localStorage.setItem(STORAGE_CUSTOM_URL_KEY, url.trim());
    } else {
      window.localStorage.removeItem(STORAGE_CUSTOM_URL_KEY);
    }
  } catch (err) {
    console.error('Failed to update custom imposition URL in localStorage:', err);
  }
}
