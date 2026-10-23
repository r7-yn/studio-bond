import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminPushConfig,
  removeAdminPushSubscription,
  saveAdminPushSubscription,
  sendAdminPushTest,
} from "../services/adminPush";

interface PwaNotificationsPanelProps {
  csrfToken: string;
  theme: "light" | "dark";
}

function decodeVapidKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function PwaNotificationsPanel({ csrfToken, theme }: PwaNotificationsPanelProps) {
  const isDark = theme === "dark";
  const [configured, setConfigured] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"subscribe" | "unsubscribe" | "test" | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAdminPushConfig(),
      navigator.serviceWorker?.ready
        .then((registration) => registration.pushManager.getSubscription())
        .catch(() => null),
    ])
      .then(([config, current]) => {
        if (!active) return;
        setConfigured(config.configured && Boolean(config.publicKey));
        setSubscription(current);
        setPermission("Notification" in window ? Notification.permission : "denied");
      })
      .catch((error) =>
        toast.error("تعذر فحص إعدادات الإشعارات", {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const subscribe = async () => {
    setBusy("subscribe");
    try {
      const config = await getAdminPushConfig();
      if (!config.publicKey) throw new Error("لم يضبط الخادم VAPID_PUBLIC_KEY بعد");
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error("هذا المتصفح لا يدعم Web Push");
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") throw new Error("لم يتم منح إذن الإشعارات");
      const registration = await navigator.serviceWorker.ready;
      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(config.publicKey) as BufferSource,
      });
      await saveAdminPushSubscription(csrfToken, nextSubscription);
      setSubscription(nextSubscription);
      toast.success("تم تفعيل إشعارات الإدارة على هذا الجهاز");
    } catch (error) {
      toast.error("تعذر تفعيل الإشعارات", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    setBusy("unsubscribe");
    try {
      const endpoint = subscription.endpoint;
      await removeAdminPushSubscription(csrfToken, endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      toast.success("تم إيقاف إشعارات هذا الجهاز");
    } catch (error) {
      toast.error("تعذر إيقاف الإشعارات", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const result = await sendAdminPushTest(csrfToken);
      toast.success(`تم إرسال ${result.sent} إشعار اختباري`);
    } catch (error) {
      toast.error("تعذر إرسال الإشعار الاختباري", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      className={`rounded-3xl border p-6 sm:p-8 ${isDark ? "border-[#D4AF37]/25 bg-[#16161C]" : "border-black/10 bg-white shadow-sm"}`}
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black">إشعارات الطلبات على جهازك</h3>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-gray-400">
              اختيارية ومدير فقط. لا نطلب الإذن تلقائياً، ولا نعتبر التفعيل ناجحاً قبل حفظ اشتراك
              المتصفح في الخادم.
            </p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${subscription ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-gray-400"}`}
        >
          {subscription ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
          {loading ? "جارٍ الفحص…" : subscription ? "مفعل على هذا الجهاز" : "غير مفعل"}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {!subscription ? (
          <button
            type="button"
            onClick={subscribe}
            disabled={loading || !configured || busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy === "subscribe" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            تفعيل الإشعارات
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={test}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/35 px-4 py-2.5 text-xs font-bold text-[#D4AF37] disabled:opacity-50"
            >
              {busy === "test" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال اختبار
            </button>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-xs font-bold text-red-300 disabled:opacity-50"
            >
              {busy === "unsubscribe" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              إيقاف هذا الجهاز
            </button>
          </>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5" /> الإذن: {permission}
        </span>
      </div>
      {!configured && (
        <p className="mt-3 text-xs text-amber-400">
          ينقص إعداد VAPID_PUBLIC_KEY وVAPID_PRIVATE_KEY على الخادم، لذلك الزر متوقف حتى لا يوهمك
          بنجاح غير حقيقي.
        </p>
      )}
    </section>
  );
}
