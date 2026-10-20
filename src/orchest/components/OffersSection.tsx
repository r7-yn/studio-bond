import React from "react";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import type { OfferPackage } from "../types/index";
import { getVisibleOffers } from "../utils/offerLogic";

interface OffersSectionProps {
  offers: OfferPackage[];
  enabled: boolean;
  onContact: (message: string) => void;
}

export const OffersSection: React.FC<OffersSectionProps> = ({ offers, enabled, onContact }) => {
  const visibleOffers = enabled ? getVisibleOffers(offers) : [];
  if (visibleOffers.length === 0) return null;

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      aria-labelledby="offers-heading"
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-o-primary text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>اختيارات منتقاة بعناية</span>
          </div>
          <h2 id="offers-heading" className="text-xl sm:text-2xl font-bold">
            باقات تصنع لحظتكم
          </h2>
          <p className="text-xs sm:text-sm mt-1 text-o-muted">
            عروض واضحة وهادئة تساعدكم على اتخاذ القرار بثقة.
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar md:grid md:grid-cols-2 md:gap-6 md:overflow-visible xl:grid-cols-3">
        {visibleOffers.map((offer) => (
          <article
            key={offer.id}
            className="min-w-[86%] sm:min-w-[62%] md:min-w-0 snap-start rounded-2xl border border-o-primary/25 bg-o-surface shadow-sm overflow-hidden flex flex-col"
          >
            {offer.type === "banner_image" && offer.bannerUrl && (
              <img
                src={offer.bannerUrl}
                alt={offer.title}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover md:aspect-[21/9]"
              />
            )}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <span className="text-[11px] font-bold text-o-primary">
                {offer.badge || "عرض خاص"}
              </span>
              <h3 className="text-lg sm:text-xl font-bold mt-3">{offer.title}</h3>
              {offer.description && (
                <p className="text-sm leading-7 mt-2 text-o-muted">{offer.description}</p>
              )}
              {offer.features.length > 0 && (
                <ul className="space-y-2 mt-5 text-sm">
                  {offer.features.map((feature, index) => (
                    <li key={`${offer.id}-${index}`} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-o-primary shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-5">
                <div className="mb-4 flex items-center gap-2">
                  {offer.priceOriginal != null && offer.priceCurrent != null && (
                    <span className="text-xs text-o-muted line-through">
                      {offer.priceOriginal} {offer.currency}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-o-muted">
                    {offer.priceCurrent != null
                      ? `${offer.priceCurrent} ${offer.currency}`
                      : "السعر عند الطلب"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onContact(offer.whatsappMessageTemplate)}
                  aria-label={`${offer.ctaText}: ${offer.title}`}
                  className="min-h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-o-primary px-4 py-2.5 text-sm font-bold text-o-on-primary hover:bg-o-primary-hover transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  {offer.ctaText}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
