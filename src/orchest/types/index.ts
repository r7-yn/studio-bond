export type RhythmType = 'بدون موسيقى' | 'دفوف' | 'أوركسترا';

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
}

export interface Category {
  id: CategoryId;
  name: string;
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
  status: 'جديد' | 'قيد التنفيذ' | 'مكتمل';
}

export interface KPIData {
  totalVisits: number;
  totalStreams: number;
  whatsappLeads: number;
  conversionRate: number;
}

export type ThemeMode = 'dark' | 'light';

export type AppView = 'home' | 'catalog' | 'track-details' | 'admin' | 'favorites' | 'artists' | 'artist-details';

