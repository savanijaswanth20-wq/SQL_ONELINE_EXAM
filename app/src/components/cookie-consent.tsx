import { useState, useEffect, useCallback } from "react";
import {
  Cookie,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  Info,
} from "@phosphor-icons/react";
import {
  getCookieConsent,
  saveCookieConsent,
  acceptAllCookies,
  rejectNonEssentialCookies,
  EVENT_CONSENT_UPDATED,
  EVENT_OPEN_COOKIE_SETTINGS,
  type CookiePreferences,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Preference draft state inside the modal
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getCookieConsent();
    if (!existing) {
      setShowBanner(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      setPreferences(existing.preferences);
    }

    const handleOpenSettings = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
        setPreferences(current.preferences);
      }
      setShowModal(true);
    };

    const handleConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<CookiePreferences>;
      if (customEvent.detail) {
        setAnalytics(customEvent.detail.analytics);
        setMarketing(customEvent.detail.marketing);
        setPreferences(customEvent.detail.preferences);
      }
    };

    window.addEventListener(EVENT_OPEN_COOKIE_SETTINGS, handleOpenSettings);
    window.addEventListener(EVENT_CONSENT_UPDATED, handleConsentUpdated);

    return () => {
      window.removeEventListener(EVENT_OPEN_COOKIE_SETTINGS, handleOpenSettings);
      window.removeEventListener(EVENT_CONSENT_UPDATED, handleConsentUpdated);
    };
  }, []);

  const handleAcceptAll = useCallback(() => {
    acceptAllCookies();
    setShowBanner(false);
    setShowModal(false);
  }, []);

  const handleRejectNonEssential = useCallback(() => {
    rejectNonEssentialCookies();
    setShowBanner(false);
    setShowModal(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveCookieConsent({
      analytics,
      marketing,
      preferences,
    });
    setShowBanner(false);
    setShowModal(false);
  }, [analytics, marketing, preferences]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  if (!mounted) return null;

  return (
    <>
      {/* Cookie Banner - Appears only on first visit */}
      {showBanner && !showModal && (
        <section
          className="cookie-banner-wrapper"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="cookie-banner-card">
            <div className="cookie-banner-header">
              <div className="cookie-banner-icon-box">
                <Cookie size={24} weight="duotone" />
              </div>
              <div className="cookie-banner-text">
                <h2 className="cookie-banner-title">We Value Your Privacy</h2>
                <p className="cookie-banner-description">
                  We use strictly necessary cookies to ensure the assessment engine,
                  authentication, and progress tracking function securely. With your consent, we
                  also use non-essential cookies to analyze usage and remember your preferences.{" "}
                  <a href="/cookie-policy" className="cookie-policy-link">
                    Read our Cookie Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="cookie-banner-actions">
              <button
                type="button"
                className="cookie-btn cookie-btn-manage"
                onClick={() => setShowModal(true)}
              >
                <SlidersHorizontal size={14} />
                <span>Manage Preferences</span>
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-reject"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Preferences Dialog / Modal */}
      {showModal && (
        <div
          className="cookie-modal-backdrop"
          onClick={() => setShowModal(false)}
          role="presentation"
        >
          <div
            className="cookie-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-heading"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-modal-header">
              <div className="cookie-modal-title-row">
                <div className="cookie-modal-icon-badge">
                  <ShieldCheck size={20} weight="fill" />
                </div>
                <div>
                  <h2 id="cookie-modal-heading" className="cookie-modal-title">
                    Cookie &amp; Privacy Preferences
                  </h2>
                  <p className="cookie-modal-subtitle">
                    Control which cookie categories you allow. Necessary cookies are required for core features.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cookie-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cookie-modal-body">
              {/* Category 1: Strictly Necessary */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>Strictly Necessary Cookies</strong>
                    <span className="cookie-badge cookie-badge-required">
                      Always Active
                    </span>
                  </div>
                  <p className="cookie-category-desc">
                    Required for the site to function properly. Enables secure GitHub authentication,
                    exam timer synchronization, question answers caching, and CSRF protection.
                    These cannot be disabled.
                  </p>
                </div>
                <div className="cookie-category-toggle-wrap">
                  <input
                    type="checkbox"
                    id="cookie-toggle-necessary"
                    className="cookie-toggle-input"
                    checked={true}
                    disabled={true}
                    aria-label="Strictly Necessary Cookies (Always Active)"
                  />
                  <label
                    htmlFor="cookie-toggle-necessary"
                    className="cookie-toggle-slider cookie-toggle-disabled"
                  >
                    <span className="cookie-toggle-thumb">
                      <Check size={11} weight="bold" />
                    </span>
                  </label>
                </div>
              </div>

              {/* Category 2: Analytics & Performance */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>Analytics &amp; Performance Cookies</strong>
                    <span className="cookie-badge cookie-badge-optional">Optional</span>
                  </div>
                  <p className="cookie-category-desc">
                    Allows us to count visits, calculate error rates, and monitor response latency
                    so we can assess and improve exam performance. All data is aggregated and anonymized.
                  </p>
                </div>
                <div className="cookie-category-toggle-wrap">
                  <input
                    type="checkbox"
                    id="cookie-toggle-analytics"
                    className="cookie-toggle-input"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    aria-label="Analytics & Performance Cookies"
                  />
                  <label
                    htmlFor="cookie-toggle-analytics"
                    className={`cookie-toggle-slider ${analytics ? "active" : ""}`}
                  >
                    <span className="cookie-toggle-thumb">
                      {analytics && <Check size={11} weight="bold" />}
                    </span>
                  </label>
                </div>
              </div>

              {/* Category 3: Preferences & Functionality */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>Functional &amp; Preference Cookies</strong>
                    <span className="cookie-badge cookie-badge-optional">Optional</span>
                  </div>
                  <p className="cookie-category-desc">
                    Enables enhanced functionality and personalization, such as remembering your
                    sidebar collapse preferences, code syntax styling, and assessment filter layouts.
                  </p>
                </div>
                <div className="cookie-category-toggle-wrap">
                  <input
                    type="checkbox"
                    id="cookie-toggle-preferences"
                    className="cookie-toggle-input"
                    checked={preferences}
                    onChange={(e) => setPreferences(e.target.checked)}
                    aria-label="Functional & Preference Cookies"
                  />
                  <label
                    htmlFor="cookie-toggle-preferences"
                    className={`cookie-toggle-slider ${preferences ? "active" : ""}`}
                  >
                    <span className="cookie-toggle-thumb">
                      {preferences && <Check size={11} weight="bold" />}
                    </span>
                  </label>
                </div>
              </div>

              {/* Category 4: Marketing & Communications */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>Marketing &amp; Announcement Cookies</strong>
                    <span className="cookie-badge cookie-badge-optional">Optional</span>
                  </div>
                  <p className="cookie-category-desc">
                    Used to measure the relevance of certification updates and curriculum announcements.
                    We never sell your personal information or assessment results to third parties.
                  </p>
                </div>
                <div className="cookie-category-toggle-wrap">
                  <input
                    type="checkbox"
                    id="cookie-toggle-marketing"
                    className="cookie-toggle-input"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    aria-label="Marketing & Announcement Cookies"
                  />
                  <label
                    htmlFor="cookie-toggle-marketing"
                    className={`cookie-toggle-slider ${marketing ? "active" : ""}`}
                  >
                    <span className="cookie-toggle-thumb">
                      {marketing && <Check size={11} weight="bold" />}
                    </span>
                  </label>
                </div>
              </div>

              <div className="cookie-modal-note">
                <Info size={16} />
                <span>
                  For complete transparency, learn more in our{" "}
                  <a href="/cookie-policy" className="cookie-policy-link">
                    Cookie Policy
                  </a>
                  . You can change your consent at any time.
                </span>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button
                type="button"
                className="cookie-btn cookie-btn-reject"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <div className="cookie-modal-footer-right">
                <button
                  type="button"
                  className="cookie-btn cookie-btn-secondary"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  className="cookie-btn cookie-btn-accept"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
