const consentKey = "orchest_analytics_consent";
const measurementId = import.meta.env["VITE_GA4_MEASUREMENT_ID"]?.trim();

export function getGa4Consent(): "accepted" | "declined" | null {
  try {
    const value = typeof window === "undefined" ? null : window.localStorage.getItem(consentKey);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function saveGa4Consent(value: "accepted" | "declined"): void {
  try {
    window.localStorage.setItem(consentKey, value);
  } catch {
    return;
  }
  if (value === "accepted") initializeGa4();
}

function hasAnalyticsConsent(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(consentKey) === "accepted";
  } catch {
    return false;
  }
}

export function isGa4Configured(): boolean {
  return Boolean(measurementId && /^G-[A-Z0-9]+$/.test(measurementId));
}

export function initializeGa4(): boolean {
  if (!isGa4Configured() || !hasAnalyticsConsent() || typeof window === "undefined") return false;
  if (window.gtag) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });

  if (!document.querySelector(`script[data-orchest-ga4="${measurementId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset["orchestGa4"] = measurementId;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }
  return true;
}

export function trackGa4Event(
  eventName: "track_play" | "order_modal_open" | "whatsapp_click",
  parameters: Record<string, string | number | boolean | undefined>,
): void {
  if (!initializeGa4()) return;
  window.gtag?.("event", eventName, parameters);
}

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}
