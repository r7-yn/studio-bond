export type RhythmType = "بدون موسيقى" | "دفوف" | "أوركسترا";

export type CategoryId = string;

export interface Track {
  id: string;
  title: string;
  artist: string;
  code: string; // e.g. #ORC-204
  duration: number; // in seconds
  durationFormatted: string; // "04:32"
  playsCount: number;
  likesCount: number;
  rhythm: RhythmType;
  categoryId: CategoryId;
  categoryLabel: string;
  coverUrl: string;
  audioUrl?: string;
  lyrics?: string;
  isTrend?: boolean;
  isExclusive?: boolean;
  executionDays: string; // "1-3 أيام"
  suitableFor: string[];
  createdAt: string;
  description: string;
  audioFreq?: number; // base frequency for synth audio
  isPublished?: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  slug?: string;
  count: number;
  image: string;
  description: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  coverImage?: string;
  role: string; // e.g. 'منشد رئيسي' | 'فنان أوركسترا' | 'صوت الشيلات الفاخرة'
  bio: string;
  genres: string[];
  isVerified?: boolean;
  totalStreams?: number;
  tracksCount?: number;
}

export type OfferType = "text_card" | "banner_image";
export type SeasonalThemeKey = "default" | "ramadan" | "eid" | "national_day" | "wedding_season";

export interface OfferPackage {
  id: string;
  title: string;
  badge?: string;
  description?: string;
  type: OfferType;
  bannerUrl?: string;
  features: string[];
  priceOriginal?: number;
  priceCurrent?: number;
  currency: string;
  ctaText: string;
  whatsappMessageTemplate: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface AppThemeSettings {
  activeTheme: SeasonalThemeKey;
  forceThemeOverride: boolean;
  enableTimeGreetings: boolean;
  enableOffersSection: boolean;
  customGreetingsOverride?: Record<string, string>;
}

export interface OrderRequest {
  id: string;
  trackId: string;
  trackCode: string;
  trackTitle: string;
  clientNames: string;
  modificationType: string;
  occasionDate: string;
  notes?: string;
  phone?: string;
  timestamp: string;
  status: "جديد" | "قيد التنفيذ" | "مكتمل";
}

export interface KPIData {
  totalVisits: number;
  totalStreams: number;
  whatsappLeads: number;
  conversionRate: number;
}

export type ThemeMode = "dark" | "light";

export type AppView =
  "home" | "catalog" | "track-details" | "admin" | "favorites" | "artists" | "artist-details";

export interface GiftDeliveryRow {
  id: string;
  title: string;
  occasion_type: string;
  recipient_name: string | null;
  recipient_phone: string;
  greeting: string;
  created_at: string;
  is_active: boolean;
}
