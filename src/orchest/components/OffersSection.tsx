import React from "react";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { ThemeMode } from "../types/index";

interface Offer {
  badge: string;
  title: string;
  description: string;
  features: string[];
  value: string;
  message: string;
}

const OFFERS: Offer[] = [
  {
    badge: "الباقة الملكية",
    title: "بصمتكم الصوتية الخاصة",
    description: "تنفيذ حصري بالأسماء والكلمات التي تختارونها، بهندسة صوتية تليق بليلتكم.",
    features: ["تنفيذ حصري بالأسماء", "توزيع خليجي فاخر", "تسليم خلال 48 ساعة"],
    value: "اختيار فاخر لمناسبتكم",
    message: "مرحباً، أود الاستفسار عن الباقة الملكية لبصمتي الصوتية الخاصة.",
  },
  {
    badge: "عرض الموسم",
    title: "باقة العروسين",
    description: "زفة دخول، ترحيبية للضيوف، ونسخة مخصصة تجمع تفاصيل يومكم في تجربة واحدة.",
    features: ["زفة دخول مخصصة", "ترحيبية بأسماء الضيوف", "مراجعة قبل التسليم"],
    value: "حل متكامل لليلة واحدة",
    message: "مرحباً، أود معرفة تفاصيل باقة العروسين وعرض الموسم.",
  },
  {
    badge: "للمناسبات الخاصة",
    title: "شيلة الحضور والهيبة",
    description: "اختيار حماسي للعرضة والاحتفالات، بصوت واضح وإيقاع يرفع حضور المناسبة.",
    features: ["اختيار صوت مناسب", "مكساج احترافي", "تعديل واحد مجاني"],
    value: "صوت يليق بالمقام",
    message: "مرحباً، أود طلب شيلة خاصة لمناسبتي القادمة.",
  },
];

interface OffersSectionProps {
  theme: ThemeMode;
  onContact: (message: string) => void;
}

export const OffersSection: React.FC<OffersSectionProps> = ({ theme, onContact }) => {
  const isDark = theme === "dark";
  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      aria-labelledby="offers-heading"
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-o-primary text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>اختيارات منتقاة بعناية</span>
          </div>
          <h2 id="offers-heading" className="text-xl sm:text-2xl font-bold">
            باقات تصنع لحظتكم
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            لا بانرات مزعجة؛ فقط خدمات واضحة وهادئة تساعدكم على اتخاذ القرار بثقة.
          </p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
        {OFFERS.map((offer) => (
          <article
            key={offer.title}
            className={`min-w-[86%] sm:min-w-[62%] md:min-w-0 snap-start rounded-2xl border p-5 sm:p-6 flex flex-col ${isDark ? "bg-gradient-to-br from-[#1A1A22] via-[#14141A] to-[#0E0E12] border-o-primary/25" : "bg-white border-o-primary/25 shadow-sm"}`}
          >
            <span className="text-[11px] font-bold text-o-primary">{offer.badge}</span>
            <h3 className="text-lg sm:text-xl font-bold mt-3">{offer.title}</h3>
            <p
              className={`text-sm leading-7 mt-2 min-h-14 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {offer.description}
            </p>
            <ul className="space-y-2 mt-5 text-sm">
              {offer.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-o-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-o-primary/15 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-o-muted">{offer.value}</span>
              <button
                onClick={() => onContact(offer.message)}
                className="inline-flex items-center gap-2 rounded-xl bg-o-primary px-3 py-2 text-xs font-bold text-o-on-primary hover:bg-o-primary-hover transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                تواصل معنا
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
