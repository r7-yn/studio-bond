// Persistent data layer: public reads go straight to the database (read-only rules),
// visitor orders are inserted directly (insert-only rule), admin writes go through /api/admin/*.
import { supabase } from "@/integrations/supabase/client";
import type {
  AppThemeSettings,
  Artist,
  Category,
  OfferPackage,
  OrderRequest,
  RhythmType,
  Track,
} from "../types/index";
import { adminHeaders } from "../utils/adminAuth";

export interface Catalog {
  tracks: Track[];
  categories: Category[];
  artists: Artist[];
  whatsappNumber: string | null;
  offers: OfferPackage[];
  themeSettings: AppThemeSettings;
}

const RHYTHMS: RhythmType[] = ["بدون موسيقى", "دفوف", "أوركسترا"];

export async function loadCatalog(): Promise<Catalog> {
  const [t, c, a, s, o, th] = await Promise.all([
    supabase.from("tracks").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("artists").select("*").order("sort_order"),
    supabase.from("site_settings").select("key,value"),
    supabase.from("offers_packages").select("*").order("display_order"),
    supabase.from("app_theme_settings").select("*").eq("id", "current_settings").limit(1),
  ]);
  const err = t.error || c.error || a.error || s.error || o.error || th.error;
  if (err) throw new Error(err.message);

  const categories: Category[] = (c.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    count: r.track_count ?? 0,
    image: r.image_url ?? "",
    description: r.description,
  }));
  const catName = new Map(categories.map((x) => [x.id, x.name]));

  const tracks: Track[] = (t.data ?? []).map((r) => {
    const track: Track = {
      id: r.id,
      title: r.title,
      artist: r.artist || r.vocalist,
      code: r.code,
      duration: r.duration_seconds || r.duration_sec,
      durationFormatted: r.duration_formatted || r.duration,
      playsCount: r.plays_count ?? 0,
      likesCount: r.likes_count ?? 0,
      rhythm: (RHYTHMS as string[]).includes(r.rhythm) ? (r.rhythm as RhythmType) : "بدون موسيقى",
      categoryId: r.category_id ?? "",
      categoryLabel: catName.get(r.category_id ?? "") ?? "",
      coverUrl: r.cover_url || r.cover_image,
      isTrend: r.is_trend,
      isExclusive: r.is_exclusive,
      executionDays: r.execution_days,
      suitableFor: Array.isArray(r.suitable_for) ? (r.suitable_for as unknown[]).map(String) : [],
      createdAt: (r.created_at ?? "").slice(0, 10),
      description: r.description,
    };
    if (r.audio_url) track.audioUrl = r.audio_url;
    if (r.lyrics) track.lyrics = r.lyrics;
    if (r.audio_frequency != null) track.audioFreq = r.audio_frequency;
    return track;
  });

  const artists: Artist[] = (a.data ?? []).map((r) => {
    const artist: Artist = {
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      role: r.role,
      bio: r.bio,
      genres: Array.isArray(r.genres) ? (r.genres as unknown[]).map(String) : [],
      isVerified: r.is_verified,
      totalStreams: r.total_streams,
      tracksCount: r.tracks_count,
    };
    if (r.cover_image) artist.coverImage = r.cover_image;
    return artist;
  });

  const whatsappNumber = (s.data ?? []).find((x) => x.key === "whatsapp_number")?.value ?? null;
  const themeRow = th.data?.[0];
  const themeSettings: AppThemeSettings = {
    activeTheme: (themeRow?.active_theme ?? "default") as AppThemeSettings["activeTheme"],
    forceThemeOverride: themeRow?.force_theme_override ?? false,
    enableTimeGreetings: themeRow?.enable_time_greetings ?? true,
    enableOffersSection: themeRow?.enable_offers_section ?? true,
    customGreetingsOverride:
      themeRow?.custom_greetings_override &&
      typeof themeRow.custom_greetings_override === "object" &&
      !Array.isArray(themeRow.custom_greetings_override)
        ? Object.fromEntries(
            Object.entries(themeRow.custom_greetings_override).map(([key, value]) => [
              key,
              String(value),
            ]),
          )
        : undefined,
  };
  const offers: OfferPackage[] = (o.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    badge: row.badge ?? undefined,
    description: row.description ?? undefined,
    type: row.type === "banner_image" ? "banner_image" : "text_card",
    bannerUrl: row.banner_url ?? undefined,
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    priceOriginal: row.price_original ?? undefined,
    priceCurrent: row.price_current ?? undefined,
    currency: row.currency,
    ctaText: row.cta_text,
    whatsappMessageTemplate: row.whatsapp_message_template,
    isActive: row.is_active,
    displayOrder: row.display_order,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    createdAt: row.created_at,
  }));
  return { tracks, categories, artists, whatsappNumber, offers, themeSettings };
}

export async function saveOrder(order: OrderRequest): Promise<void> {
  const { error } = await supabase.from("order_logs").insert({
    track_id: order.trackId || null,
    track_title: order.trackTitle,
    track_code: order.trackCode,
    names: order.clientNames,
    client_names: order.clientNames,
    event_type: order.modificationType,
    modification_type: order.modificationType,
    event_date: order.occasionDate || null,
    occasion_date: order.occasionDate || null,
    notes: order.notes ?? null,
    phone: order.phone ?? null,
  });
  if (error) throw new Error(error.message);
}

async function adminPost(
  path: string,
  csrf: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrf }),
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data ? String(data.error) : "تعذر الحفظ";
    throw new Error(msg);
  }
  return data;
}

export function adminMutate(csrf: string, body: Record<string, unknown>): Promise<unknown> {
  return adminPost("/api/admin/mutate", csrf, body);
}

export interface AdminConfig {
  offers: Array<Record<string, unknown>>;
  theme: Record<string, unknown> | null;
}

export function adminLoadConfig(csrf: string): Promise<AdminConfig> {
  return adminPost("/api/admin/config", csrf, {}) as Promise<AdminConfig>;
}

interface OrderRow {
  id: string;
  track_id: string | null;
  track_code: string;
  track_title: string;
  client_names: string;
  names: string;
  modification_type: string;
  event_type: string;
  occasion_date: string | null;
  event_date: string | null;
  notes: string | null;
  phone: string | null;
  created_at: string | null;
  status: string;
}

export function recordVisit(): void {
  void supabase
    .from("analytics_events")
    .insert({ event_type: "visit" })
    .then(({ error }) => {
      if (error) console.error("Visit log failed", error.message);
    });
}

export async function adminLoadOrders(
  csrf: string,
): Promise<{ orders: OrderRequest[]; visits: number }> {
  const data = (await adminPost("/api/admin/orders", csrf, {})) as {
    orders?: OrderRow[];
    visits?: number;
  };
  const orders = (data.orders ?? []).map((r) => {
    const o: OrderRequest = {
      id: r.id,
      trackId: r.track_id ?? "",
      trackCode: r.track_code,
      trackTitle: r.track_title,
      clientNames: r.client_names || r.names,
      modificationType: r.modification_type || r.event_type,
      occasionDate: r.occasion_date ?? r.event_date ?? "",
      timestamp: (r.created_at ?? "").replace("T", " ").slice(0, 16),
      status: r.status === "قيد التنفيذ" || r.status === "مكتمل" ? r.status : "جديد",
    };
    if (r.notes) o.notes = r.notes;
    if (r.phone) o.phone = r.phone;
    return o;
  });
  return { orders, visits: data.visits ?? 0 };
}
