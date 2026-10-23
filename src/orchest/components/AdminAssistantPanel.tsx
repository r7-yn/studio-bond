import { useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { askAdminAssistant, type AdminAssistantResponse } from "../services/adminAssistant";

interface AdminAssistantPanelProps {
  csrfToken: string;
  theme: "light" | "dark";
}

const EXAMPLES = [
  "كم عدد الأعمال والطلبات الموجودة حالياً؟",
  "ما الأعمال التي تناسب زفة عروس هادئة؟",
  "اعرض الطلبات التي تحتاج متابعة مع الأدلة.",
];

export function AdminAssistantPanel({ csrfToken, theme }: AdminAssistantPanelProps) {
  const isDark = theme === "dark";
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<AdminAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = message.trim();
    if (!value || loading) return;
    setLoading(true);
    try {
      setAnswer(await askAdminAssistant(csrfToken, value));
    } catch (error) {
      toast.error("تعذر تشغيل المساعد", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`mb-6 rounded-3xl border p-5 sm:p-6 ${isDark ? "border-[#D4AF37]/25 bg-[#16161C]" : "border-black/10 bg-white shadow-sm"}`}
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <BrainCircuit className="h-5 w-5" />
            <span className="text-xs font-black tracking-[0.12em]">ORCHEST OPS AI</span>
          </div>
          <h2 className={`mt-2 text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
            مساعد الإدارة من بياناتك
          </h2>
          <p
            className={`mt-1 max-w-2xl text-sm leading-7 ${isDark ? "text-white/60" : "text-gray-500"}`}
          >
            يقرأ الأعمال والطلبات والإحصاءات المصرح بها فقط. كل إجابة تعرض مراجعها، وإذا لم توجد
            بيانات مؤيدة سيقول ذلك بدلاً من التخمين.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> وصول المدير فقط
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="admin-assistant-question">
          سؤال المساعد
        </label>
        <input
          id="admin-assistant-question"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="اسأل عن عمل، طلب، حالة أو رقم..."
          maxLength={1000}
          className={`min-h-12 flex-1 rounded-2xl border px-4 text-sm outline-none transition focus:border-[#D4AF37] ${isDark ? "border-white/10 bg-white/5 text-white placeholder:text-white/35" : "border-black/10 bg-gray-50 text-gray-900 placeholder:text-gray-400"}`}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-5 text-sm font-black text-black transition hover:bg-[#efcf62] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          اسأل الآن
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setMessage(example)}
            className={`rounded-full border px-3 py-1.5 text-[11px] transition ${isDark ? "border-white/10 text-white/60 hover:border-[#D4AF37]/50 hover:text-white" : "border-black/10 text-gray-500 hover:border-[#D4AF37] hover:text-gray-900"}`}
          >
            <Sparkles className="mr-1 inline h-3 w-3 text-[#D4AF37]" />
            {example}
          </button>
        ))}
      </div>

      {answer && (
        <div
          className={`mt-5 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs font-black ${isDark ? "text-white/80" : "text-gray-700"}`}>
              الإجابة الموثقة
            </span>
            <span
              className={`text-[11px] font-bold ${answer.needsReview ? "text-amber-400" : "text-emerald-400"}`}
            >
              {answer.needsReview ? "تحتاج مراجعة بشرية" : "مدعومة بالبيانات"} ·{" "}
              {Math.round(answer.confidence * 100)}%
            </span>
          </div>
          <p
            className={`mt-3 whitespace-pre-line text-sm leading-8 ${isDark ? "text-white/85" : "text-gray-700"}`}
          >
            {answer.answer}
          </p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="مراجع الأدلة">
            {answer.evidenceRefs.map((ref) => (
              <span
                key={ref}
                className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-bold text-[#a78316] dark:text-[#e6c85d]"
              >
                <CheckCircle2 className="h-3 w-3" /> {ref}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
