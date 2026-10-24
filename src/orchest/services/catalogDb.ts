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
  tracksTotal: number;
  categories: Category[];
  artists: Artist[];
  whatsappNumber: string | null;
  offers: OfferPackage[];
  themeSettings: AppThemeSettings;
}

const RHYTHMS: RhythmType[] = ["بدون موسيقى", "دفوف", "أوركسترا"];
const PUBLIC_TRACKS_PAGE_SIZE = 40;

export async function loadCatalog(): Promise<Catalog> {
  const [t, c, a, s, o, th] = await Promise.all([
    supabase
      .from("tracks")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(0, PUBLIC_TRACKS_PAGE_SIZE - 1),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("artists").select("*").order("sort_order"),
    supabase.from("site_settings").select("key,value").eq("key", "whatsapp_number"),
    supabase.from("offers_packages").select("*").order("display_order"),
    supabase.from("app_theme_settings").select("*").eq("id", "current_settings").limit(1),
  ]);
  const err = t.error || c.error || a.error || s.error || o.error || th.error;
  if (err) throw new Error(err.message);

  const categories: Category[] = (c.data ?? [])
    .filter((r) => (r.track_count ?? 0) > 0)
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
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
      // Legacy counters were seeded as demo values; recorded events are the source of truth.
      playsCount: 0,
      likesCount: 0,
      rhythm: (RHYTHMS as string[]).includes(r.rhythm) ? (r.rhythm as RhythmType) : "بدون موسيقى",
      categoryId: r.category_id ?? "",
      categoryLabel: catName.get(r.category_id ?? "") ?? "",
      coverUrl: r.cover_url || r.cover_image || "/icon-512.png",
      isPublished: r.is_published !== false,
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

  const artists: Artist[] = (a.data ?? [])
    .filter((r) => r.tracks_count > 0)
    .map((r) => {
      const artist: Artist = {
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        role: r.role,
        bio: r.bio,
        genres: Array.isArray(r.genres) ? (r.genres as unknown[]).map(String) : [],
        isVerified: r.is_verified,
        totalStreams: 0,
        tracksCount: r.tracks_count ?? 0,
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
    ...(themeRow?.custom_greetings_override &&
    typeof themeRow.custom_greetings_override === "object" &&
    !Array.isArray(themeRow.custom_greetings_override)
      ? {
          customGreetingsOverride: Object.fromEntries(
            Object.entries(themeRow.custom_greetings_override).map(([key, value]) => [
              key,
              String(value),
            ]),
          ),
        }
      : {}),
  };
  const offers: OfferPackage[] = (o.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    ...(row.badge != null ? { badge: row.badge } : {}),
    ...(row.description != null ? { description: row.description } : {}),
    type: row.type === "banner_image" ? "banner_image" : "text_card",
    ...(row.banner_url != null ? { bannerUrl: row.banner_url } : {}),
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    ...(row.price_original != null ? { priceOriginal: row.price_original } : {}),
    ...(row.price_current != null ? { priceCurrent: row.price_current } : {}),
    currency: row.currency,
    ctaText: row.cta_text,
    whatsappMessageTemplate: row.whatsapp_message_template,
    isActive: row.is_active,
    displayOrder: row.display_order,
    ...(row.start_date != null ? { startDate: row.start_date } : {}),
    ...(row.end_date != null ? { endDate: row.end_date } : {}),
    createdAt: row.created_at,
  }));
  return {
    tracks,
    tracksTotal: t.count ?? tracks.length,
    categories,
    artists,
    whatsappNumber,
    offers,
    themeSettings,
  };
}

export async function loadCatalogTrackPage(
  offset: number,
  categories: Category[],
): Promise<Track[]> {
  const pageSize = PUBLIC_TRACKS_PAGE_SIZE;
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);
  if (error) throw new Error(error.message);

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return (data ?? []).map((r) => {
    const categoryId = r.category_id ?? "";
    const track: Track = {
      id: r.id,
      title: r.title,
      artist: r.artist || r.vocalist,
      code: r.code,
      duration: r.duration_seconds || r.duration_sec,
      durationFormatted: r.duration_formatted || r.duration,
      playsCount: 0,
      likesCount: 0,
      rhythm: (RHYTHMS as string[]).includes(r.rhythm) ? (r.rhythm as RhythmType) : "بدون موسيقى",
      categoryId,
      categoryLabel: categoryNames.get(categoryId) ?? "",
      coverUrl: r.cover_url || r.cover_image,
      isPublished: r.is_published !== false,
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
}

export interface OrderSubmissionGuard {
  formStartedAt: number;
  website: string;
}

async function publicPost(path: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return;
  const data: unknown = await response.json().catch(() => null);
  const message =
    data && typeof data === "object" && "error" in data ? String(data.error) : "تعذر إرسال الطلب";
  throw new Error(message);
}

export async function saveOrder(order: OrderRequest, guard: OrderSubmissionGuard): Promise<void> {
  await publicPost("/api/public/orders", {
    requestId: order.id,
    trackId: order.trackId,
    clientNames: order.clientNames,
    modificationType: order.modificationType,
    occasionDate: order.occasionDate,
    notes: order.notes ?? "",
    phone: order.phone ?? "",
    formStartedAt: guard.formStartedAt,
    website: guard.website,
  });
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

export async function adminLoadEntities(
  csrf: string,
): Promise<{ categories: Category[]; artists: Artist[] }> {
  const data = (await adminPost("/api/admin/entities", csrf, {})) as {
    categories?: Array<Record<string, unknown>>;
    artists?: Array<Record<string, unknown>>;
  };
  const categories: Category[] = (data.categories ?? []).map((row) => ({
    id: String(row["id"] ?? ""),
    name: String(row["name"] ?? ""),
    count: Number(row["track_count"] ?? 0),
    image: String(row["image_url"] ?? ""),
    description: String(row["description"] ?? ""),
  }));
  const artists: Artist[] = (data.artists ?? []).map((row) => ({
    id: String(row["id"] ?? ""),
    name: String(row["name"] ?? ""),
    avatar: String(row["avatar"] ?? ""),
    role: String(row["role"] ?? ""),
    bio: String(row["bio"] ?? ""),
    genres: Array.isArray(row["genres"]) ? row["genres"].map(String) : [],
    isVerified: row["is_verified"] === true,
    totalStreams: 0,
    tracksCount: Number(row["tracks_count"] ?? 0),
    ...(row["cover_image"] ? { coverImage: String(row["cover_image"]) } : {}),
  }));
  return { categories, artists };
}

export async function adminLoadTracks(csrf: string, categories: Category[]): Promise<Track[]> {
  const data = (await adminPost("/api/admin/catalog", csrf, {})) as {
    tracks?: unknown[];
  };
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return (data.tracks ?? []).map((value) => {
    const r = value as Record<string, unknown>;
    const categoryId = String(r["category_id"] ?? "");
    const track: Track = {
      id: String(r["id"] ?? ""),
      title: String(r["title"] ?? ""),
      artist: String(r["artist"] ?? r["vocalist"] ?? ""),
      code: String(r["code"] ?? ""),
      duration: Number(r["duration_seconds"] ?? r["duration_sec"] ?? 0),
      durationFormatted: String(r["duration_formatted"] ?? r["duration"] ?? "00:00"),
      playsCount: 0,
      likesCount: 0,
      rhythm: (RHYTHMS as string[]).includes(String(r["rhythm"]))
        ? (String(r["rhythm"]) as RhythmType)
        : "بدون موسيقى",
      categoryId,
      categoryLabel: categoryNames.get(categoryId) ?? "",
      coverUrl: String(r["cover_url"] ?? r["cover_image"] ?? ""),
      isPublished: r["is_published"] !== false,
      isTrend: r["is_trend"] === true,
      isExclusive: r["is_exclusive"] === true,
      executionDays: String(r["execution_days"] ?? ""),
      suitableFor: Array.isArray(r["suitable_for"]) ? r["suitable_for"].map(String) : [],
      createdAt: String(r["created_at"] ?? "").slice(0, 10),
      description: String(r["description"] ?? ""),
    };
    if (typeof r["audio_url"] === "string" && r["audio_url"]) track.audioUrl = r["audio_url"];
    if (typeof r["lyrics"] === "string" && r["lyrics"]) track.lyrics = r["lyrics"];
    if (typeof r["audio_frequency"] === "number") track.audioFreq = r["audio_frequency"];
    return track;
  });
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

export interface AdminOrdersQuery {
  offset: number;
  limit: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  trackId?: string;
  includeMetrics?: boolean;
}

export function recordVisit(): void {
  void publicPost("/api/public/events", { eventType: "visit" }).catch((error: unknown) => {
    console.error("Visit log failed", error instanceof Error ? error.message : "unknown error");
  });
}

export function recordTrackPlay(trackId: string): void {
  if (!trackId) return;
  void publicPost("/api/public/events", { eventType: "play", trackId }).catch((error: unknown) => {
    console.error("Playback log failed", error instanceof Error ? error.message : "unknown error");
  });
}

export interface AdminOrdersResult {
  orders: OrderRequest[];
  total: number;
  visits: number;
  plays: number;
  whatsappLeads: number;
}

export async function adminLoadOrders(
  csrf: string,
  query: AdminOrdersQuery = { offset: 0, limit: 25, includeMetrics: true },
): Promise<AdminOrdersResult> {
  const data = (await adminPost("/api/admin/orders", csrf, { ...query })) as {
    orders?: OrderRow[];
    totalOrders?: number;
    visits?: number;
    plays?: number;
    whatsappLeads?: number;
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
  return {
    orders,
    total: data.totalOrders ?? 0,
    visits: data.visits ?? 0,
    plays: data.plays ?? 0,
    whatsappLeads: data.whatsappLeads ?? 0,
  };
}

export async function adminLoadAllOrders(
  csrf: string,
  filters: Omit<AdminOrdersQuery, "offset" | "limit">,
): Promise<OrderRequest[]> {
  const pageSize = 100;
  const allOrders: OrderRequest[] = [];
  let total = Number.POSITIVE_INFINITY;

  while (allOrders.length < total) {
    const result = await adminLoadOrders(csrf, {
      ...filters,
      offset: allOrders.length,
      limit: pageSize,
      includeMetrics: false,
    });
    allOrders.push(...result.orders);
    total = result.total;
    if (result.orders.length === 0) break;
  }

  return allOrders;
}
