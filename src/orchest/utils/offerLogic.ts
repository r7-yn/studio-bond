import type { OfferPackage } from "../types/index";

export function parseOfferDateBoundary(value: string | undefined, isEnd: boolean): Date | null {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateValue = isDateOnly ? `${value}T${isEnd ? "23:59:59.999" : "00:00:00.000"}Z` : value;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  if (isDateOnly && parsed.toISOString().slice(0, 10) !== value) return null;
  return parsed;
}

export function getVisibleOffers(offers: OfferPackage[], now: Date = new Date()): OfferPackage[] {
  return offers
    .filter((offer) => {
      if (!offer.isActive) return false;
      const start = parseOfferDateBoundary(offer.startDate, false);
      const end = parseOfferDateBoundary(offer.endDate, true);
      if (offer.startDate && (!start || now < start)) return false;
      if (offer.endDate && (!end || now > end)) return false;
      return true;
    })
    .sort((left, right) => left.displayOrder - right.displayOrder);
}
