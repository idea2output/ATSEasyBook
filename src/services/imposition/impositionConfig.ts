/**
 * Configuration and Endpoint Resolver for ATS Impose.
 * Mounts directly beneath ATS Tech at /Impose/ on the same host (no separate ports or subdomains).
 */

export interface ImpositionServiceConfig {
  url: string;
  isConfigured: boolean;
  environment: 'integrated' | 'custom' | 'unconfigured';
  source: 'integrated' | 'env' | 'localStorage' | 'none';
  statusDescription: string;
}

export const INTEGRATED_IMPOSITION_PATH = '/Impose/';
export const DEFAULT_IMPOSITION_DEV_URL = INTEGRATED_IMPOSITION_PATH;
export const RECOMMENDED_PROD_SUBDOMAIN = INTEGRATED_IMPOSITION_PATH;
export const STORAGE_CUSTOM_URL_KEY = 'ats_custom_imposition_url';

/**
 * Resolves the active ATS Impose endpoint URL.
 * Defaults always to integrated same-origin /Impose/ without separate dev ports.
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

  if (customUrl && customUrl.length > 0) {
    return {
      url: customUrl,
      isConfigured: true,
      environment: 'custom',
      source: 'localStorage',
      statusDescription: `Custom operator override active (${customUrl})`,
    };
  }

  const envUrl = process.env.NEXT_PUBLIC_IMPOSITION_URL?.trim();
  if (envUrl && envUrl.length > 0 && !envUrl.includes('5173')) {
    return {
      url: envUrl,
      isConfigured: true,
      environment: 'integrated',
      source: 'env',
      statusDescription: `Configured via environment (${envUrl})`,
    };
  }

  // Integrated path on the same host
  return {
    url: INTEGRATED_IMPOSITION_PATH,
    isConfigured: true,
    environment: 'integrated',
    source: 'integrated',
    statusDescription: 'Integrated platform mounting active (/Impose/)',
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
