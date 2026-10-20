import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OfferPackage } from "../types/index";
import { getSeasonalTheme } from "../utils/cultural";
import { getVisibleOffers } from "../utils/offerLogic";
import { OffersSection } from "./OffersSection";

function makeOffer(overrides: Partial<OfferPackage> = {}): OfferPackage {
  return {
    id: "offer-1",
    title: "الباقة الملكية",
    type: "text_card",
    features: ["تنفيذ بالأسماء"],
    currency: "ر.س",
    ctaText: "اطلب عبر واتساب",
    whatsappMessageTemplate: "أرغب بطلب الباقة الملكية",
    isActive: true,
    displayOrder: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("offers visibility", () => {
  it("shows only active offers within their inclusive date window in display order", () => {
    const offers = [
      makeOffer({ id: "late", title: "لاحقاً", displayOrder: 3, startDate: "2026-10-21" }),
      makeOffer({ id: "expired", title: "منتهي", displayOrder: 2, endDate: "2026-10-19" }),
      makeOffer({ id: "inactive", title: "متوقف", isActive: false }),
      makeOffer({ id: "invalid", title: "تاريخ غير صالح", startDate: "2026-02-30" }),
      makeOffer({ id: "valid", title: "ساري", displayOrder: 4, endDate: "2026-10-20" }),
      makeOffer({ id: "first", title: "أولاً", displayOrder: 1 }),
    ];

    const visible = getVisibleOffers(offers, new Date("2026-10-20T20:00:00.000Z"));

    expect(visible.map((offer) => offer.id)).toEqual(["first", "valid"]);
  });

  it("renders a banner and calls the WhatsApp handler with the configured message", () => {
    const onContact = vi.fn();
    const bannerOffer = makeOffer({
      type: "banner_image",
      bannerUrl: "https://example.com/offer.webp",
      priceCurrent: 250,
      priceOriginal: 350,
    });

    render(<OffersSection offers={[bannerOffer]} enabled onContact={onContact} />);

    expect(screen.getByRole("img", { name: "الباقة الملكية" })).toHaveAttribute(
      "src",
      "https://example.com/offer.webp",
    );
    expect(screen.getByText("250 ر.س")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /الباقة الملكية/ }));
    expect(onContact).toHaveBeenCalledWith("أرغب بطلب الباقة الملكية");
  });

  it("does not render the section when disabled or when no offers are available", () => {
    const onContact = vi.fn();
    const offer = makeOffer();

    const { rerender } = render(
      <OffersSection offers={[offer]} enabled={false} onContact={onContact} />,
    );
    expect(screen.queryByRole("region", { name: "باقات تصنع لحظتكم" })).not.toBeInTheDocument();

    rerender(<OffersSection offers={[]} enabled onContact={onContact} />);
    expect(screen.queryByRole("region", { name: "باقات تصنع لحظتكم" })).not.toBeInTheDocument();
  });
});

describe("seasonal theme override", () => {
  it("uses an explicitly selected theme instead of the automatic date-based theme", () => {
    const theme = getSeasonalTheme(new Date("2026-09-23T12:00:00.000Z"), "ramadan");
    expect(theme.key).toBe("ramadan");
    expect(theme.greeting).toContain("رمضان");
  });
});
