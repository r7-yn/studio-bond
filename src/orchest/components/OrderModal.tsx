import React, { useEffect, useState } from "react";
import {
  X,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Music,
  Check,
} from "lucide-react";
import { Track, ThemeMode, OrderRequest } from "../types/index";
import { generateWhatsAppMessage, generateWhatsAppUrl } from "../utils/trackLogic";
import { validateOrderStep, ORDER_STEPS, type OrderStep } from "../utils/orderSteps";
import { trackGa4Event } from "../services/ga4";

interface OrderModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (
    order: OrderRequest,
    guard: { formStartedAt: number; website: string },
  ) => Promise<void>;
  theme: ThemeMode;
  whatsappNumber?: string;
}

const modificationOptions = [
  { value: "تغيير الأسماء فقط", hint: "نفس العمل مع أسمائكم" },
  { value: "إضافة مقدمة صوتية وشعر خاص بالأسماء", hint: "مقدمة شعرية تليق بالمناسبة" },
  { value: "تعديل الإيقاع والمؤثرات (دفوف / بدون موسيقى)", hint: "اختيار الإيقاع المناسب" },
  { value: "تنفيذ زفة حصرية كاملة من الصفر", hint: "عمل خاص بكم بالكامل" },
];

const inputClass =
  "w-full px-4 py-3 rounded-[10px] border border-o-border bg-o-bg text-o-text placeholder:text-o-muted text-sm outline-none transition-colors focus:border-o-primary";

export const OrderModal: React.FC<OrderModalProps> = ({
  track,
  isOpen,
  onClose,
  onSubmitOrder,
  whatsappNumber = "",
}) => {
  const [step, setStep] = useState<OrderStep>(0);
  const [clientNames, setClientNames] = useState("");
  const [modificationType, setModificationType] = useState("تغيير الأسماء فقط");
  const [occasionDate, setOccasionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFormStartedAt(Date.now());
    setRequestId(crypto.randomUUID());
    setHoneypot("");
    setIsSubmitting(false);
    setShowSuccess(false);
    setConfirmationMessage("");
    setCopied(false);
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const form = { clientNames, modificationType, occasionDate, notes, phone };

  const goNext = () => {
    const problem = validateOrderStep(step, form);
    if (problem) return setError(problem);
    setError(null);
    setStep((s) => Math.min(2, s + 1) as OrderStep);
  };
  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1) as OrderStep);
  };

  const handleSendOrder = async () => {
    if (isSubmitting) return;
    for (const s of [0, 1] as OrderStep[]) {
      const problem = validateOrderStep(s, form);
      if (problem) {
        setStep(s);
        return setError(problem);
      }
    }
    const message = generateWhatsAppMessage(track, {
      clientNames,
      modificationType,
      occasionDate,
      notes,
      customPhone: phone,
    });
    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, message);
    if (!whatsappUrl)
      return setError("رقم واتساب الاستوديو غير صالح حالياً. يرجى المحاولة لاحقاً.");

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitOrder(
        {
          id: requestId,
          trackId: track.id,
          trackCode: track.code,
          trackTitle: track.title,
          clientNames: clientNames.trim(),
          modificationType,
          occasionDate,
          notes: notes.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          status: "جديد",
        },
        { formStartedAt, website: honeypot },
      );
      setConfirmationMessage(message);
      setShowSuccess(true);
      setCopied(false);
    } catch (submitError) {
      console.error("Order submission failed", submitError);
      setError("تعذر حفظ الطلب حالياً. يرجى المحاولة مجدداً.");
      setIsSubmitting(false);
    }
  };
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(confirmationMessage);
      setCopied(true);
    } catch {
      setError("تعذر النسخ تلقائياً. حدد الرسالة وانسخها يدوياً.");
    }
  };
  const closeSuccess = () => {
    setShowSuccess(false);
    setConfirmationMessage("");
    setCopied(false);
    setStep(0);
    setFormStartedAt(Date.now());
    setRequestId(crypto.randomUUID());
    setIsSubmitting(false);
    onClose();
  };

  const progress = ((step + 1) / ORDER_STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir="rtl"
    >
      <div onClick={onClose} className="fixed inset-0 bg-o-overlay backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="طلب الزفة باسمك"
        className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-o-border bg-o-surface text-o-text shadow-o-elevated animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="order-website-field">لا تعبئ هذا الحقل</label>
          <input
            id="order-website-field"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-o-primary/15 text-o-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">طلب الزفة باسمك</h3>
              <p className="text-xs text-o-muted">ثلاث خطوات بسيطة ثم نكمل معك عبر واتساب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق نافذة الطلب"
            className="p-2 rounded-[10px] text-o-muted hover:bg-o-surface-hover hover:text-o-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper + progress bar */}
        <div className="px-6 pb-5">
          <ol className="flex items-center justify-between mb-3">
            {ORDER_STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex items-center gap-2 text-xs sm:text-sm">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      done
                        ? "bg-o-primary border-o-primary text-o-on-primary"
                        : active
                          ? "border-o-primary text-o-primary"
                          : "border-o-border text-o-muted"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className={active || done ? "font-medium text-o-text" : "text-o-muted"}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="h-1.5 w-full rounded-full bg-o-border overflow-hidden" aria-hidden="true">
            <div
              className="h-full rounded-full bg-o-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {showSuccess ? (
          <div className="px-6 pb-7 sm:px-10">
            <div className="w-16 h-16 rounded-full bg-o-whatsapp/15 text-o-whatsapp mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h4 className="text-xl font-semibold mb-2">تم تسجيل طلبك</h4>
              <p className="text-sm text-o-muted mb-5">
                أرسل الرسالة الجاهزة إلى الاستوديو عبر واتساب لتأكيد التفاصيل.
              </p>
            </div>
            <div className="mx-auto max-w-xl space-y-3">
              <div className="rounded-xl border border-o-border bg-o-bg p-4">
                <p className="mb-1 text-xs text-o-muted">رقم واتساب الاستوديو</p>
                <p dir="ltr" className="text-left font-semibold">
                  {whatsappNumber || "غير متاح حالياً"}
                </p>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-o-muted">رسالة جاهزة للنسخ</span>
                <textarea
                  readOnly
                  rows={6}
                  value={confirmationMessage}
                  className="w-full rounded-xl border border-o-border bg-o-bg p-3 text-sm leading-6"
                />
              </label>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-o-primary px-5 text-sm font-semibold text-o-on-primary hover:bg-o-primary-hover"
                >
                  <Copy className="h-4 w-4" /> {copied ? "تم نسخ الرسالة" : "نسخ الرسالة"}
                </button>
                <a
                  href={generateWhatsAppUrl(whatsappNumber, confirmationMessage)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackGa4Event("whatsapp_click", {
                      track_id: track.id,
                      track_code: track.code,
                    })
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-o-border px-5 text-sm font-semibold hover:bg-o-surface-hover"
                >
                  <MessageCircle className="h-4 w-4" /> فتح واتساب
                </a>
                <button
                  type="button"
                  onClick={closeSuccess}
                  className="inline-flex h-11 items-center rounded-[10px] px-5 text-sm font-medium text-o-muted hover:text-o-text"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 px-6 pb-6 sm:grid-cols-[1fr_15rem]">
            {/* Step content */}
            <div className="space-y-4 min-w-0">
              {step === 0 && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold mb-2">اختر نوع الطلب</legend>
                  {modificationOptions.map((opt) => {
                    const selected = modificationType === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setModificationType(opt.value)}
                        aria-pressed={selected}
                        className={`w-full text-right flex items-center gap-3 p-4 rounded-[10px] border transition-colors ${
                          selected
                            ? "border-o-primary bg-o-primary/10"
                            : "border-o-border bg-o-bg hover:bg-o-surface-hover"
                        }`}
                      >
                        <span
                          className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                            selected ? "border-o-primary" : "border-o-border"
                          }`}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-o-primary" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{opt.value}</span>
                          <span className="block text-xs text-o-muted mt-0.5">{opt.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </fieldset>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-medium mb-1.5">
                      أسماء العروسين أو صاحب المناسبة <span className="text-o-primary">*</span>
                    </span>
                    <input
                      autoFocus
                      value={clientNames}
                      onChange={(e) => setClientNames(e.target.value)}
                      placeholder="مثال: أحمد ونورة"
                      maxLength={120}
                      className={inputClass}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="block text-sm font-medium mb-1.5">
                        تاريخ المناسبة (اختياري)
                      </span>
                      <input
                        type="date"
                        value={occasionDate}
                        onChange={(e) => setOccasionDate(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium mb-1.5">
                        رقم التواصل (اختياري)
                      </span>
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                        className={`${inputClass} text-left`}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1.5">ملاحظات إضافية</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      placeholder="أي تفاصيل تحب نعرفها"
                      className={`${inputClass} resize-none`}
                    />
                    <span className="block text-left text-xs text-o-muted mt-1">
                      {notes.length}/500
                    </span>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">راجع طلبك قبل الإرسال</h4>
                  <dl className="divide-y divide-o-border rounded-[10px] border border-o-border bg-o-bg text-sm">
                    {[
                      ["نوع الطلب", modificationType, 0],
                      ["الأسماء", clientNames, 1],
                      ["تاريخ المناسبة", occasionDate || "لم يحدد", 1],
                      ["رقم التواصل", phone || "لم يحدد", 1],
                      ["ملاحظات", notes || "لا توجد", 1],
                    ].map(([k, v, s]) => (
                      <div key={k as string} className="flex items-start justify-between gap-3 p-3">
                        <dt className="text-o-muted shrink-0">{k}</dt>
                        <dd className="flex-1 text-left break-words">{v}</dd>
                        <button
                          type="button"
                          onClick={() => setStep(s as OrderStep)}
                          className="text-xs text-o-primary hover:underline shrink-0"
                        >
                          تعديل
                        </button>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-o-muted">
                    بعد تسجيل الطلب ستظهر لك نافذة برقم واتساب ورسالة جاهزة للنسخ، ويمكنك فتح
                    المحادثة يدوياً.
                  </p>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-[10px] border border-o-danger/30 bg-o-danger/10 px-3 py-2 text-sm text-o-danger"
                >
                  {error}
                </p>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-o-border px-4 text-sm font-medium hover:bg-o-surface-hover transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" /> السابق
                  </button>
                ) : (
                  <span />
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-o-primary px-5 text-sm font-semibold text-o-on-primary hover:bg-o-primary-hover transition-colors"
                  >
                    التالي <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOrder}
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-o-whatsapp px-5 text-sm font-semibold text-o-on-whatsapp hover:bg-o-whatsapp-hover transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageCircle className="w-4 h-4" />{" "}
                    {isSubmitting ? "جارٍ حفظ الطلب..." : "تأكيد عبر واتساب"}
                  </button>
                )}
              </div>
            </div>

            {/* Live order summary (no prices by design) */}
            <aside className="rounded-2xl border border-o-border bg-o-bg p-4 h-fit sm:sticky sm:top-4">
              <p className="text-xs font-medium text-o-muted mb-3">ملخص الطلب</p>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-12 h-12 rounded-[10px] object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{track.title}</p>
                  <p className="text-xs text-o-muted truncate">{track.artist}</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-o-primary shrink-0" />
                  <span dir="ltr" className="font-mono text-o-primary">
                    {track.code}
                  </span>
                  <span className="text-o-muted">• {track.durationFormatted}</span>
                </li>
                <li className="text-o-muted">
                  الطلب: <span className="text-o-text">{modificationType}</span>
                </li>
                <li className="text-o-muted">
                  الأسماء: <span className="text-o-text">{clientNames || "—"}</span>
                </li>
                <li className="text-o-muted">
                  التاريخ: <span className="text-o-text">{occasionDate || "—"}</span>
                </li>
                <li className="text-o-muted">
                  مدة التنفيذ: <span className="text-o-text">{track.executionDays}</span>
                </li>
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
