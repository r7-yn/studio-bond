import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, Youtube } from "lucide-react";
import { toast } from "sonner";
import {
  getYouTubeStatus,
  startYouTubeConnect,
  syncYouTube,
  type YouTubeConnection,
} from "../services/youtubeIntegration";

interface YouTubeImportPanelProps {
  csrfToken: string;
  theme: "light" | "dark";
}

export function YouTubeImportPanel({ csrfToken, theme }: YouTubeImportPanelProps) {
  const isDark = theme === "dark";
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"connect" | "sync" | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const result = await getYouTubeStatus();
      setConnection(result.connection);
      setConfigured(result.configured);
    } catch (error) {
      toast.error("تعذر قراءة حالة YouTube", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const connect = async () => {
    setBusy("connect");
    try {
      const url = await startYouTubeConnect(csrfToken);
      window.location.assign(url);
    } catch (error) {
      toast.error("تعذر بدء ربط YouTube", {
        description: error instanceof Error ? error.message : undefined,
      });
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy("sync");
    try {
      const result = await syncYouTube(csrfToken);
      toast.success("اكتملت مزامنة YouTube", {
        description: `تم إدخال ${result.imported} عمل للمراجعة قبل النشر.`,
      });
      await loadStatus();
    } catch (error) {
      toast.error("تعذرت المزامنة", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      className={`rounded-3xl border p-5 sm:p-7 ${isDark ? "border-white/10 bg-[#16161C]" : "border-black/10 bg-white shadow-sm"}`}
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-red-400">
            <Youtube className="h-5 w-5" />
            <span className="text-xs font-black tracking-[0.12em]">YOUTUBE IMPORT</span>
          </div>
          <h2 className={`mt-2 text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
            اربط قناة الاستوديو واستورد أعمالك
          </h2>
          <p
            className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? "text-white/60" : "text-gray-500"}`}
          >
            نقرأ العنوان والوصف والصورة والمدة والرابط فقط بصلاحية YouTube للقراءة. كل عنصر يصل كعمل
            غير منشور ويحتاج مراجعتك قبل ظهوره للزوار.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${connection?.status === "connected" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
        >
          {loading ? "جارٍ الفحص…" : connection?.status === "connected" ? "متصل" : "غير متصل"}
        </span>
      </div>

      <div
        className={`mt-6 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"}`}
      >
        {connection ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                {connection.channel_title}
              </p>
              <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-gray-500"}`}>
                آخر مزامنة:{" "}
                {connection.last_sync_at
                  ? new Date(connection.last_sync_at).toLocaleString("ar-SA")
                  : "لم تتم بعد"}
              </p>
              {connection.last_error && (
                <p className="mt-2 text-xs text-amber-400">{connection.last_error}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sync}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-black disabled:opacity-50"
              >
                {busy === "sync" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                مزامنة أحدث الأعمال
              </button>
              <a
                href="https://studio.youtube.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/75"
              >
                <ExternalLink className="h-3.5 w-3.5" /> استوديو YouTube
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                لا توجد قناة مرتبطة
              </p>
              <p className={`mt-1 text-xs leading-6 ${isDark ? "text-white/55" : "text-gray-500"}`}>
                {configured
                  ? "سيتم فتح موافقة Google في صفحة آمنة ثم العودة إلى لوحة الإدارة."
                  : "أكمل YOUTUBE_CLIENT_ID وYOUTUBE_CLIENT_SECRET وPUBLIC_SITE_URL في الخادم أولاً."}
              </p>
            </div>
            <button
              type="button"
              onClick={connect}
              disabled={!configured || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === "connect" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4" />
              )}
              ربط قناة YouTube
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["صلاحية قراءة فقط", "استيراد غير منشور", "منع التكرار بالمعرف"].map((item) => (
          <div
            key={item}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${isDark ? "bg-white/5 text-white/70" : "bg-black/[0.03] text-gray-600"}`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {item}
          </div>
        ))}
      </div>
    </section>
  );
}
