import { useEffect, useState } from "react";
import { Gift, Headphones, LoaderCircle, Music2, ShieldCheck } from "lucide-react";

interface GiftCardData {
  title: string;
  occasionType: string;
  recipientName: string | null;
  greeting: string;
  audioUrl: string;
}

const occasionLabels: Record<string, string> = {
  wedding: "زفاف سعيد",
  sheila: "عمل صوتي خاص",
  newborn: "فرحة مولود",
  welcome: "ترحيب وتقدير",
  other: "مناسبة سعيدة",
};

export function GiftCardPage({ token }: { token: string }) {
  const [card, setCard] = useState<GiftCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/gifts/${encodeURIComponent(token)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "تعذر فتح بطاقة الإهداء.";
          throw new Error(message);
        }
        setCard(payload as GiftCardData);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "تعذر فتح بطاقة الإهداء.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111116] px-4 py-10 text-white"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <section className="relative w-full max-w-xl rounded-[2rem] border border-[#D4AF37]/25 bg-[#19191f] p-7 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
          {loading ? (
            <LoaderCircle className="h-7 w-7 animate-spin" />
          ) : (
            <Gift className="h-7 w-7" />
          )}
        </div>
        <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">
          ORCHEST · بطاقة إهداء خاصة
        </p>
        {loading ? (
          <p className="mt-5 text-sm text-white/60" role="status">
            جارٍ تجهيز البطاقة الصوتية…
          </p>
        ) : error ? (
          <div className="mt-5" role="alert">
            <h1 className="text-xl font-bold">الرابط غير متاح</h1>
            <p className="mt-3 text-sm leading-7 text-white/60">{error}</p>
          </div>
        ) : card ? (
          <>
            <p className="mt-5 text-sm text-white/60">
              {occasionLabels[card.occasionType] ?? "مناسبة سعيدة"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {card.recipientName ? `إلى ${card.recipientName}` : "إهداء بكل محبة"}
            </h1>
            <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-base leading-8 text-white/75">
              {card.greeting}
            </p>
            <div className="my-7 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/50 to-transparent" />
            <div className="mb-4 flex items-center justify-center gap-2 text-[#D4AF37]">
              <Music2 className="h-4 w-4" />
              <h2 className="font-semibold">{card.title}</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs text-white/55">
                <Headphones className="h-4 w-4" />
                استمع إلى الإهداء
              </div>
              <audio
                className="w-full"
                controls
                preload="metadata"
                src={card.audioUrl}
                controlsList="nodownload"
                aria-label={`تشغيل ${card.title}`}
              >
                متصفحك لا يدعم تشغيل الصوت.
              </audio>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" />
              بطاقة خاصة عبر رمز QR
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
