import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Category, RhythmType, Track } from "../types/index";

const publicTrackColumns =
  "id,title,artist,vocalist,code,duration_seconds,duration_sec,duration,duration_formatted,rhythm,category_id,cover_url,cover_image,is_published,is_trend,is_exclusive,execution_days,suitable_for,created_at,description,audio_url";
const rhythmOptions: RhythmType[] = ["بدون موسيقى", "دفوف", "أوركسترا"];

type PublicTrackRow = Pick<
  Database["public"]["Tables"]["tracks"]["Row"],
  | "id"
  | "title"
  | "artist"
  | "vocalist"
  | "code"
  | "duration_seconds"
  | "duration_sec"
  | "duration"
  | "duration_formatted"
  | "rhythm"
  | "category_id"
  | "cover_url"
  | "cover_image"
  | "is_published"
  | "is_trend"
  | "is_exclusive"
  | "execution_days"
  | "suitable_for"
  | "created_at"
  | "description"
  | "audio_url"
>;

type PublicCategoryRow = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "slug" | "description" | "image_url" | "track_count"
>;

function getPublicClient() {
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase public configuration is missing");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function mapTrack(row: PublicTrackRow, categoryLabel: string): Track {
  const rhythm = rhythmOptions.includes(row.rhythm as RhythmType)
    ? (row.rhythm as RhythmType)
    : "بدون موسيقى";
  const track: Track = {
    id: row.id,
    title: row.title,
    artist: row.artist || row.vocalist,
    code: row.code,
    duration: row.duration_seconds || row.duration_sec,
    durationFormatted: row.duration_formatted || row.duration,
    playsCount: 0,
    likesCount: 0,
    rhythm,
    categoryId: row.category_id ?? "",
    categoryLabel,
    coverUrl: row.cover_url || row.cover_image || "/icon-512.png",
    isPublished: row.is_published,
    isTrend: row.is_trend,
    isExclusive: row.is_exclusive,
    executionDays: row.execution_days,
    suitableFor: Array.isArray(row.suitable_for) ? row.suitable_for.map(String) : [],
    createdAt: (row.created_at ?? "").slice(0, 10),
    description: row.description,
  };
  if (row.audio_url) track.audioUrl = row.audio_url;
  return track;
}

export const loadPublicTrackPage = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }) => {
    const normalizedCode = data.code.replace(/^#/, "").toUpperCase();
    if (!/^[A-Z0-9-]{1,80}$/.test(normalizedCode)) return null;
    const supabase = getPublicClient();
    const { data: rows, error } = await supabase
      .from("tracks")
      .select(publicTrackColumns)
      .in("code", [normalizedCode, `#${normalizedCode}`])
      .eq("is_published", true)
      .limit(2);
    if (error) throw new Error("تعذر تحميل صفحة العمل حالياً");
    const row = rows?.length === 1 ? (rows[0] as PublicTrackRow) : null;
    if (!row) return null;

    let categoryLabel = "";
    if (row.category_id) {
      const { data: category } = await supabase
        .from("categories")
        .select("name")
        .eq("id", row.category_id)
        .maybeSingle();
      categoryLabel = category?.name ?? "";
    }
    return mapTrack(row, categoryLabel);
  });

export const loadPublicCategoryPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(120) }))
  .handler(async ({ data }) => {
    if (!/^[\p{L}\p{N}-]+$/u.test(data.slug)) return null;
    const supabase = getPublicClient();
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id,name,slug,description,image_url,track_count")
      .eq("slug", data.slug)
      .maybeSingle();
    if (categoryError) throw new Error("تعذر تحميل صفحة التصنيف حالياً");
    const categoryRow = categoryData as PublicCategoryRow | null;
    if (!categoryRow) return null;

    const [{ data: trackRows, error: tracksError, count }, { count: publishedCount }] =
      await Promise.all([
        supabase
          .from("tracks")
          .select(publicTrackColumns, { count: "exact" })
          .eq("category_id", categoryRow.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("tracks")
          .select("id", { count: "exact", head: true })
          .eq("category_id", categoryRow.id)
          .eq("is_published", true),
      ]);
    if (tracksError) throw new Error("تعذر تحميل أعمال التصنيف حالياً");

    const category: Category = {
      id: categoryRow.id,
      name: categoryRow.name,
      slug: categoryRow.slug,
      count: publishedCount ?? count ?? 0,
      image: categoryRow.image_url ?? "/icon-512.png",
      description: categoryRow.description,
    };
    return {
      category,
      tracks: (trackRows ?? []).map((row) => mapTrack(row as PublicTrackRow, category.name)),
    };
  });
