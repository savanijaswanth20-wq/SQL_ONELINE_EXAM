export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: number;
}

export const CONSENT_STORAGE_KEY = "cookie_consent_preferences";
export const CONSENT_COOKIE_NAME = "cookie_consent";
export const CURRENT_CONSENT_VERSION = 1;

export const EVENT_CONSENT_UPDATED = "cookie_consent_updated";
export const EVENT_OPEN_COOKIE_SETTINGS = "open_cookie_settings";

export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CookiePreferences;
      if (parsed && typeof parsed === "object" && parsed.necessary === true) {
        return parsed;
      }
    }

    // Check cookie fallback
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (match) {
      const val = decodeURIComponent(match.split("=")[1]);
      const parsed = JSON.parse(val) as CookiePreferences;
      if (parsed && typeof parsed === "object" && parsed.necessary === true) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parsing errors
  }

  return null;
}

export function hasGivenConsent(): boolean {
  return getCookieConsent() !== null;
}

export function saveCookieConsent(
  prefs: Partial<Pick<CookiePreferences, "analytics" | "marketing" | "preferences">>
): CookiePreferences {
  const updated: CookiePreferences = {
    necessary: true, // Necessary cookies must ALWAYS remain enabled
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    preferences: Boolean(prefs.preferences),
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage may fail in restricted sandboxes
    }

    try {
      const oneYear = 365 * 24 * 60 * 60;
      const isHttps = window.location.protocol === "https:";
      const secureFlag = isHttps ? "; Secure" : "";
      document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(updated)
      )}; max-age=${oneYear}; path=/; SameSite=Lax${secureFlag}`;
    } catch {
      // ignore cookie write errors
    }

    window.dispatchEvent(
      new CustomEvent(EVENT_CONSENT_UPDATED, { detail: updated })
    );
  }

  return updated;
}

export function acceptAllCookies(): CookiePreferences {
  return saveCookieConsent({
    analytics: true,
    marketing: true,
    preferences: true,
  });
}

export function rejectNonEssentialCookies(): CookiePreferences {
  return saveCookieConsent({
    analytics: false,
    marketing: false,
    preferences: false,
  });
}

export function openCookieSettings(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN_COOKIE_SETTINGS));
  }
}

export function canUseAnalytics(): boolean {
  const consent = getCookieConsent();
  return consent ? consent.analytics : false;
}

export function canUseMarketing(): boolean {
  const consent = getCookieConsent();
  return consent ? consent.marketing : false;
}

export function canUsePreferences(): boolean {
  const consent = getCookieConsent();
  return consent ? consent.preferences : false;
}
