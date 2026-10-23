import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Copy,
  Download,
  Gift,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import type { GiftDeliveryRow, ThemeMode } from "../types/index";
import {
  createGiftDelivery,
  listGiftDeliveries,
  revokeGiftDelivery,
  rotateGiftDelivery,
  uploadGiftAudio,
  type GiftTokenResult,
} from "../services/giftDelivery";

const occasions = [
  {
    id: "wedding",
    label: "زفة / زفاف",
    greeting:
      "ألف مبروك هذه المناسبة السعيدة، نهديكم هذا العمل بكل محبة. نتمنى لكم أياماً عامرة بالفرح والهناء.",
  },
  {
    id: "sheila",
    label: "شيلة / عمل حماسي",
    greeting: "نهديكم هذا العمل المميز احتفاءً بفرحتكم. دامت مناسباتكم عامرة بالفخر والسعادة.",
  },
  {
    id: "newborn",
    label: "مولود جديد",
    greeting: "ألف مبروك المولود، جعله الله من مواليد السعادة والبركة، وأنبته نباتاً حسناً.",
  },
  {
    id: "welcome",
    label: "ترحيب / استقبال",
    greeting: "يا مرحباً بكم، يسعدنا أن نهديكم هذا العمل ترحيباً وتقديراً لحضوركم.",
  },
  {
    id: "other",
    label: "مناسبة أخرى",
    greeting: "أطيب التهاني بهذه المناسبة الجميلة، مع خالص المحبة وأصدق الأمنيات بدوام الفرح.",
  },
] as const;

interface GiftCardPreview {
  delivery: GiftDeliveryRow;
  url: string;
  qrDataUrl: string;
}

function toWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function notificationMessage(delivery: GiftDeliveryRow, url: string): string {
  const person = delivery.recipient_name ? ` ${delivery.recipient_name}` : "";
  return `السلام عليكم، تم تجهيز عملكم الصوتي «${delivery.title}»${person}.\n${delivery.greeting}\nيمكنكم الاستماع إلى البطاقة عبر رمز QR أو الرابط الخاص:\n${url}`;
}

async function makePreview(result: GiftTokenResult): Promise<GiftCardPreview> {
  const url = `${window.location.origin}${result.giftPath}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#171717", light: "#ffffff" },
  });
  return { delivery: result.delivery, url, qrDataUrl };
}

export function GiftDeliveryPanel({ csrfToken, theme }: { csrfToken: string; theme: ThemeMode }) {
  const isDark = theme === "dark";
  const [deliveries, setDeliveries] = useState<GiftDeliveryRow[]>([]);
  const [title, setTitle] = useState("");
  const [occasionType, setOccasionType] = useState<(typeof occasions)[number]["id"]>("wedding");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [greeting, setGreeting] = useState<string>(occasions[0].greeting);
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<GiftCardPreview | null>(null);

  const reload = useCallback(async () => {
    try {
      setDeliveries(await listGiftDeliveries(csrfToken));
    } catch (error) {
      toast.error("تعذر تحميل سجل بطاقات التسليم", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [csrfToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (working) return;
    const digits = recipientPhone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      toast.error("أدخل رقم واتساب صحيحاً مع مفتاح الدولة.");
      return;
    }
    if (!file) {
      toast.error("اختر الملف الصوتي المراد تسليمه.");
      return;
    }
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;
    setWorking(true);
    try {
      const storagePath = await uploadGiftAudio(file, csrfToken);
      const result = await createGiftDelivery(csrfToken, {
        title: title.trim(),
        occasionType,
        recipientName: recipientName.trim(),
        recipientPhone: digits,
        greeting: greeting.trim(),
        storagePath,
      });
      const card = await makePreview(result);
      setPreview(card);
      setTitle("");
      setRecipientName("");
      setFile(null);
      const input = document.getElementById("gift-audio-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await reload();
      const waUrl = toWhatsAppUrl(digits, notificationMessage(result.delivery, card.url));
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.location.href = waUrl;
      toast.success("تم إنشاء بطاقة التسليم الخاصة.");
    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      toast.error("تعذر إنشاء بطاقة التسليم", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setWorking(false);
    }
  };

  const handleRotate = async (delivery: GiftDeliveryRow) => {
    if (!window.confirm("سيُبطل هذا الرمز القديم ويُنشئ رمز QR ورابطاً جديدين. هل تريد المتابعة؟"))
      return;
    setWorking(true);
    try {
      const result = await rotateGiftDelivery(csrfToken, delivery.id);
      setPreview(await makePreview(result));
      await reload();
      toast.success("تم تجديد رمز البطاقة؛ الرمز السابق لم يعد صالحاً.");
    } catch (error) {
      toast.error("تعذر تجديد رمز البطاقة", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async (delivery: GiftDeliveryRow) => {
    if (!window.confirm(`سيُوقف رابط «${delivery.title}» نهائياً. هل تريد المتابعة؟`)) return;
    try {
      await revokeGiftDelivery(csrfToken, delivery.id);
      await reload();
      if (preview?.delivery.id === delivery.id) setPreview(null);
      toast.success("تم إيقاف رابط البطاقة.");
    } catch (error) {
      toast.error("تعذر إيقاف الرابط", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط الخاص.");
    } catch {
      toast.error("تعذر نسخ الرابط؛ يمكنك تحديده ونسخه يدوياً.");
    }
  };

  const occasion = occasions.find((item) => item.id === occasionType) ?? occasions[0];
  const panelClass = `rounded-2xl border p-5 sm:p-6 ${isDark ? "bg-[#16161C] border-white/10" : "bg-white border-black/10 shadow-sm"}`;
  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37] ${isDark ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-black/10 text-black"}`;

  return (
    <section className="space-y-6" dir="rtl">
      <div className={panelClass}>
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-[#D4AF37]/15 p-3 text-[#D4AF37]">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">إنشاء بطاقة تسليم خاصة</h2>
            <p className="mt-1 text-sm text-gray-500">
              ارفع النسخة النهائية؛ الملف يبقى في تخزين خاص ولا يظهر في الكتالوج العام.
            </p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">
            <span>اسم العمل</span>
            <input
              className={inputClass}
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: زفة نورة وعبدالله"
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>نوع المناسبة</span>
            <select
              className={inputClass}
              value={occasionType}
              onChange={(event) => {
                const next = occasions.find((item) => item.id === event.target.value);
                if (!next) return;
                setOccasionType(next.id);
                setGreeting(next.greeting);
              }}
            >
              {occasions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>اسم المستلم (اختياري)</span>
            <input
              className={inputClass}
              maxLength={120}
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>رقم واتساب جهة الاستلام مع مفتاح الدولة</span>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={40}
              value={recipientPhone}
              onChange={(event) => setRecipientPhone(event.target.value)}
              placeholder="مثال: 9665xxxxxxxx"
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold md:col-span-2">
            <span>الملف الصوتي النهائي (MP3, M4A, AAC, WAV, OGG, WebM — حتى 30 ميجابايت)</span>
            <input
              id="gift-audio-file"
              className={`${inputClass} file:ml-3 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:font-bold file:text-black`}
              type="file"
              accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm"
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file && (
              <span className="block text-xs text-gray-500">
                الملف المختار: {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} ميجابايت
              </span>
            )}
          </label>
          <label className="space-y-1.5 text-sm font-semibold md:col-span-2">
            <span>رسالة التهنئة على البطاقة</span>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              required
              maxLength={700}
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
            />
            <span className="block text-left text-xs text-gray-500">{greeting.length}/700</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={working}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black disabled:opacity-60"
            >
              {working ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {working ? "جارٍ رفع الملف وإنشاء البطاقة…" : "إنشاء البطاقة وتجهيز واتساب"}
            </button>
            <span className="text-xs text-gray-500">
              {occasion.label} · يُنشأ رمز وصول عشوائي، ولا يُحفظ الرمز نفسه في قاعدة البيانات.
            </span>
          </div>
        </form>
      </div>

      {preview && (
        <div className={`${panelClass} grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]`}>
          <div>
            <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
              <QrCode className="h-5 w-5" />
              <h3 className="font-bold">بطاقة جاهزة للتسليم: {preview.delivery.title}</h3>
            </div>
            <p className="mb-4 text-sm leading-7 text-gray-500">
              امسح الرمز لفتح صفحة التهنئة والاستماع. رابط البطاقة نفسه سري؛ أي شخص يحصل عليه يستطيع
              فتحها.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyLink(preview.url)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-sm font-semibold"
              >
                <Copy className="h-4 w-4" />
                نسخ الرابط الخاص
              </button>
              <a
                href={preview.qrDataUrl}
                download={`orchest-gift-${preview.delivery.id}.png`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                تنزيل QR
              </a>
              <a
                href={toWhatsAppUrl(
                  preview.delivery.recipient_phone,
                  notificationMessage(preview.delivery, preview.url),
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-bold text-white"
              >
                <Send className="h-4 w-4" />
                فتح إشعار واتساب
              </a>
            </div>
            <p className="mt-3 break-all rounded-lg bg-black/5 p-2 text-xs text-gray-500 dark:bg-white/5">
              {preview.url}
            </p>
            <p className="mt-2 text-xs text-amber-600">
              واتساب يفتح الرسالة جاهزة؛ اضغط «إرسال» داخل واتساب لإشعار الجهة.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              لإرفاق صورة الباركود في المحادثة، نزّل صورة QR أعلاه وأرفقها يدوياً؛ رابط الرسالة لا
              يرفق صورة تلقائياً.
            </p>
          </div>
          <img
            src={preview.qrDataUrl}
            alt="رمز QR خاص ببطاقة التسليم"
            className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
          />
        </div>
      )}

      <div className={panelClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">سجل بطاقات التسليم</h3>
            <p className="mt-1 text-xs text-gray-500">
              آخر {deliveries.length} بطاقة · لا تُعرض مفاتيح الوصول المخزنة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-white/10 p-2 text-gray-500"
            aria-label="تحديث سجل البطاقات"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {deliveries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-white/10">
            لا توجد بطاقات تسليم محفوظة بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="flex flex-col gap-3 rounded-xl border border-black/5 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    <span>{delivery.title}</span>
                    {delivery.is_active ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
                        فعالة
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-500">
                        موقوفة
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {occasions.find((item) => item.id === delivery.occasion_type)?.label ??
                      "مناسبة"}{" "}
                    · {delivery.recipient_name || "دون اسم"} · +{delivery.recipient_phone}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(delivery.created_at).toLocaleString("ar")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {delivery.is_active && (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void handleRotate(delivery)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      تجديد QR (يبطل القديم)
                    </button>
                  )}
                  {delivery.is_active && (
                    <button
                      type="button"
                      onClick={() => void handleRevoke(delivery)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-500"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      إيقاف الرابط
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 px-1 text-xs leading-6 text-gray-500">
        <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          التخزين الخاص يمنع الوصول العام المباشر للملف. رمز QR هو رابط سري حامل؛ لا تشاركه إلا مع
          الجهة المقصودة. تنزيل/إعادة إرسال رسالة واتساب يحتاج إجراءً يدوياً داخل واتساب.
        </p>
      </div>
    </section>
  );
}
