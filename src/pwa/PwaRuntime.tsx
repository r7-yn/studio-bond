import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaRuntime() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () =>
      setIsStandalone(
        media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    updateStandalone();
    media.addEventListener?.("change", updateStandalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setShowInstall(true);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setShowInstall(false);
      updateStandalone();
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((nextRegistration) => {
          registration = nextRegistration;
          if (nextRegistration.waiting) setWaitingWorker(nextRegistration.waiting);
          nextRegistration.addEventListener("updatefound", () => {
            const installing = nextRegistration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(installing);
              }
            });
          });
        })
        .catch(() => undefined);
    }

    return () => {
      media.removeEventListener?.("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      registration?.removeEventListener("updatefound", () => undefined);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setShowInstall(false);
    setInstallPrompt(null);
  };

  const update = () => {
    waitingWorker?.postMessage({ type: "ORCHEST_SKIP_WAITING" });
    setWaitingWorker(null);
    window.setTimeout(() => window.location.reload(), 250);
  };

  if (isStandalone || (!showInstall && !waitingWorker)) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/35 bg-[#19191f]/95 p-3 text-right text-white shadow-2xl backdrop-blur"
      dir="rtl"
      aria-live="polite"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#D4AF37]">
          {waitingWorker ? "تحديث جديد من أوركست" : "ثبّت أوركست على جهازك"}
        </p>
        <p className="mt-0.5 text-xs text-white/65">
          {waitingWorker
            ? "أعد التحميل لتطبيق التحسينات بأمان."
            : "وصول أسرع وتجربة مستقلة، مع بقاء الموقع قابلاً للاستخدام بدون تثبيت."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={waitingWorker ? update : install}
          className="rounded-xl bg-[#D4AF37] px-3 py-2 text-xs font-extrabold text-black transition hover:bg-[#efcf62]"
        >
          {waitingWorker ? "تحديث" : "تثبيت"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowInstall(false);
            setWaitingWorker(null);
          }}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/75 transition hover:bg-white/10"
          aria-label="إغلاق إشعار PWA"
        >
          لاحقاً
        </button>
      </div>
    </aside>
  );
}
