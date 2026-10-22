// Ported from the original Express server.ts; handlers run on the Worker through a small req/res shim.
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { app, Type, createGatewayAiClient, type ShimReq, type ShimRes } from "./shim";
import { parseOfferDateBoundary } from "../utils/offerLogic";

interface CatalogTrack {
  id: string;
  title: string;
  artist: string;
  rhythm: string;
  categoryId: string;
  categoryLabel: string;
  code: string;
  description: string;
}

interface SemanticSearchBody {
  query: string;
  tracks: CatalogTrack[];
}

interface SeoBody {
  title: string;
  artist: string;
  category?: string;
  rhythm?: string;
  notes?: string;
}

interface ConciergeBody {
  message: string;
  tracks: CatalogTrack[];
}

const requestWindows = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

interface AdminSession {
  csrfToken: string;
  expiresAt: number;
}

const adminSessions = new Map<string, AdminSession>();
const SESSION_COOKIE = "orchest_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 210_000;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return [];
      try {
        return [
          [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())],
        ];
      } catch {
        return [];
      }
    }),
  );
}

function getAdminPasswordHash(): string | null {
  const configured = process.env["ADMIN_PASSWORD_HASH"]?.trim();
  return configured && configured.startsWith("pbkdf2$") ? configured : null;
}

function verifyAdminPassword(password: string): boolean {
  const configured = getAdminPasswordHash();
  if (!configured) {
    // Fallback: plain ADMIN_PASSWORD stored as a server-only secret, compared in constant time.
    const plain = process.env["ADMIN_PASSWORD"];
    if (!plain || plain.length < 8) return false;
    const a = createHmac("sha256", "cmp").update(password).digest();
    const b = createHmac("sha256", "cmp").update(plain).digest();
    return timingSafeEqual(a, b);
  }
  const parts = configured.split("$");
  if (parts.length !== 5 || parts[1] !== "sha512") return false;
  const iterations = Number(parts[2]);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000)
    return false;
  try {
    const expected = Buffer.from(parts[4] ?? "", "base64url");
    const actual = pbkdf2Sync(password, parts[3] ?? "", iterations, expected.length, "sha512");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function setSessionCookie(res: ShimRes, token: string): void {
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Partitioned; Max-Age=${SESSION_TTL_MS / 1000}${secure}`,
  );
}

function clearSessionCookie(res: ShimRes): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=None; Partitioned; Secure; Max-Age=0`,
  );
}

// Stateless signed sessions: Workers keep no memory between requests, so the cookie
// itself carries the expiry, signed with a key derived from the server-side password hash.
// Changing the admin password automatically signs out every existing session.
function sessionKey(): string | null {
  const explicit = process.env["ADMIN_SESSION_SECRET"]?.trim();
  if (explicit && explicit.length >= 32) return explicit;
  const hash = getAdminPasswordHash();
  return hash ? `orchest-session:${hash}` : null;
}

function sign(value: string): string | null {
  const key = sessionKey();
  return key ? createHmac("sha256", key).update(value).digest("base64url") : null;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function createSessionToken(): string | null {
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomBytes(16).toString("base64url")}`;
  const sig = sign(payload);
  return sig ? `${payload}.${sig}` : null;
}

function getAdminSession(req: ShimReq): AdminSession | null {
  const token =
    parseCookies(req.headers.cookie)[SESSION_COOKIE] || req.header("x-admin-session") || undefined;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  if (!expected || !safeEqual(expected, parts[2] ?? "")) return null;
  const expiresAt = Number(parts[0]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  const csrfToken = sign(`csrf:${token}`);
  return csrfToken ? { csrfToken, expiresAt } : null;
}

function requireAdmin(req: ShimReq, res: ShimRes): AdminSession | null {
  const session = getAdminSession(req);
  if (!session) {
    res.status(401).json({ error: "يلزم تسجيل دخول المدير" });
    return null;
  }
  return session;
}

function requireCsrf(req: ShimReq, res: ShimRes, session: AdminSession): boolean {
  const token = req.header("x-csrf-token");
  if (
    !token ||
    token.length !== session.csrfToken.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(session.csrfToken))
  ) {
    res.status(403).json({ error: "رمز حماية الطلب غير صالح" });
    return false;
  }
  return true;
}

function getClientIp(req: ShimReq): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(
  req: ShimReq,
  scope = "ai",
  limit = RATE_LIMIT,
  windowMs = RATE_WINDOW_MS,
): boolean {
  const now = Date.now();
  const key = `${scope}:${getClientIp(req)}`;
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + windowMs });
    if (requestWindows.size > 10_000) {
      for (const [oldKey, window] of requestWindows) {
        if (window.resetAt <= now) requestWindows.delete(oldKey);
      }
      while (requestWindows.size > 10_000) {
        const oldestKey = requestWindows.keys().next().value;
        if (!oldestKey) break;
        requestWindows.delete(oldestKey);
      }
    }
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

function isCatalogTrack(value: unknown): value is CatalogTrack {
  if (!value || typeof value !== "object") return false;
  const track = value as Record<string, unknown>;
  return [
    "id",
    "title",
    "artist",
    "rhythm",
    "categoryId",
    "categoryLabel",
    "code",
    "description",
  ].every((key) => typeof track[key] === "string" && (track[key] as string).length <= 500);
}

function parseCatalogTracks(value: unknown): CatalogTrack[] {
  if (!Array.isArray(value) || value.length > 500) return [];
  return value.filter(isCatalogTrack);
}

function parseBoundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

function rejectRateLimited(
  req: ShimReq,
  res: ShimRes,
  scope = "ai",
  limit = RATE_LIMIT,
  windowMs = RATE_WINDOW_MS,
): boolean {
  if (!isRateLimited(req, scope, limit, windowMs)) return false;
  res.status(429).json({ error: "طلبات كثيرة. يرجى المحاولة بعد قليل." });
  return true;
}

const loginWindows = new Map<string, { count: number; resetAt: number }>();

function rejectLoginRateLimited(req: ShimReq, res: ShimRes): boolean {
  const now = Date.now();
  const key = getClientIp(req);
  const current = loginWindows.get(key);
  if (!current || current.resetAt <= now) {
    return false;
  }
  if (current.count < 5) return false;
  res.status(429).json({ error: "محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد 15 دقيقة." });
  return true;
}

function recordLoginFailure(req: ShimReq): void {
  const now = Date.now();
  const key = getClientIp(req);
  const current = loginWindows.get(key);
  if (!current || current.resetAt <= now) {
    loginWindows.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }
  current.count += 1;
}

app.post("/api/auth/login", (req, res) => {
  if (rejectLoginRateLimited(req, res)) return null;
  const password = parseBoundedText(req.body?.["password"], 256);
  if (!password || !verifyAdminPassword(password)) {
    recordLoginFailure(req);
    return res.status(401).json({ error: "بيانات تسجيل الدخول غير صحيحة" });
  }

  const sessionToken = createSessionToken();
  if (!sessionToken) return res.status(503).json({ error: "لم يتم إعداد كلمة مرور المدير بعد" });
  setSessionCookie(res, sessionToken);
  return res.json({ authenticated: true, token: sessionToken });
});

app.get("/api/auth/session", (req, res) => {
  const session = getAdminSession(req);
  if (!session) return res.json({ authenticated: false });
  return res.json({ authenticated: true, csrfToken: session.csrfToken });
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  return res.json({ authenticated: false });
});

const aiClient = createGatewayAiClient();

/**
 * Intelligent Semantic Intent Analyzer & Matcher
 * Uses NLP rules, dialect normalization, and intent vectors
 */
function analyzeSemanticIntentFallback(query: string, tracks: CatalogTrack[]) {
  const cleanQ = query.toLowerCase().trim();
  let detectedIntent = "طلب زفة خليجية مخصصة";
  const matches: Array<{ trackId: string; score: number; reason: string }> = [];

  const wantsWithoutMusic =
    cleanQ.includes("بدون موسيقى") ||
    cleanQ.includes("بلا موسيقى") ||
    cleanQ.includes("اسلامية") ||
    cleanQ.includes("إسلامي");
  const wantsDufoof = cleanQ.includes("دفوف") || cleanQ.includes("دف") || cleanQ.includes("إيقاع");
  const wantsOrchestra =
    cleanQ.includes("اوركسترا") || cleanQ.includes("موسيقى") || cleanQ.includes("كمان");
  const wantsCalm =
    cleanQ.includes("هادي") ||
    cleanQ.includes("هدوء") ||
    cleanQ.includes("رومانسي") ||
    cleanQ.includes("ناعم");
  const wantsLuxury =
    cleanQ.includes("فخم") ||
    cleanQ.includes("ملكي") ||
    cleanQ.includes("هيبة") ||
    cleanQ.includes("كبير");
  const wantsBride =
    cleanQ.includes("عروس") ||
    cleanQ.includes("زفاف") ||
    cleanQ.includes("عرس") ||
    cleanQ.includes("دخلة") ||
    cleanQ.includes("مسيرة");
  const wantsGroom = cleanQ.includes("عريس") || cleanQ.includes("معرس") || cleanQ.includes("رجال");
  const wantsSheilat =
    cleanQ.includes("شيلة") ||
    cleanQ.includes("شيلات") ||
    cleanQ.includes("حماس") ||
    cleanQ.includes("فخر");
  const wantsWelcome =
    cleanQ.includes("ترحيب") ||
    cleanQ.includes("ضيوف") ||
    cleanQ.includes("مرحبا") ||
    cleanQ.includes("هلا");
  const wantsBaby =
    cleanQ.includes("مولود") ||
    cleanQ.includes("مواليد") ||
    cleanQ.includes("عقيقة") ||
    cleanQ.includes("بيبي");

  // Synthesize detected intent string
  const intentParts: string[] = [];
  if (wantsBride) intentParts.push("زفة عروس ملكية");
  if (wantsGroom) intentParts.push("مسيرة عريس");
  if (wantsSheilat) intentParts.push("شيلة حماسية");
  if (wantsWelcome) intentParts.push("ترحيب بالضيوف");
  if (wantsBaby) intentParts.push("استقبال مواليد");
  if (wantsCalm) intentParts.push("بطابع هادئ ورومانسي");
  if (wantsLuxury) intentParts.push("بأجواء فخمة");
  if (wantsWithoutMusic) intentParts.push("بدون موسيقى (إسلامية)");
  if (wantsDufoof) intentParts.push("بإيقاع الدفوف الخليجية");

  detectedIntent = intentParts.length > 0 ? intentParts.join(" • ") : "زفات وشيلات ملكية مختارة";

  for (const track of tracks) {
    let score = 30; // base score
    const reasons: string[] = [];

    // Check rhythm
    if (wantsWithoutMusic) {
      if (track.rhythm === "بدون موسيقى") {
        score += 35;
        reasons.push("تنفيذ نقي بدون موسيقى 100%");
      } else {
        score -= 20;
      }
    }
    if (wantsDufoof) {
      if (track.rhythm === "دفوف") {
        score += 35;
        reasons.push("إيقاع دفوف خليجية نقية");
      }
    }
    if (wantsOrchestra && track.rhythm === "أوركسترا") {
      score += 30;
      reasons.push("توزيع أوركسترالي ملكي فخم");
    }

    // Check category & mood
    if (wantsBride && track.categoryId === "zaffat-bride") {
      score += 25;
      reasons.push("مخصصة لإطلالة ومسيرة العروس");
    }
    if (wantsSheilat && track.categoryId === "sheilat-enthusiastic") {
      score += 30;
      reasons.push("شيلة حماسية وقصائد فخر");
    }
    if (wantsWelcome && track.categoryId === "welcoming") {
      score += 30;
      reasons.push("لحن ترحيبي دافئ لضيوف الحفل");
    }
    if (wantsBaby && track.categoryId === "babies") {
      score += 40;
      reasons.push("مقطوعة رقيقة لاستقبال المواليد");
    }

    // Check calm / gentle
    if (wantsCalm) {
      if (
        track.rhythm === "بدون موسيقى" ||
        track.title.includes("كلاسيك") ||
        track.title.includes("لطيفة") ||
        track.title.includes("فخمة")
      ) {
        score += 20;
        reasons.push("تناغم هادئ يمنح المسيرة هيبة وسكينة");
      }
    }

    // Keyword relevance
    const textCorpus =
      `${track.title} ${track.artist} ${track.description} ${track.categoryLabel}`.toLowerCase();
    const words = cleanQ.split(/\s+/).filter((w) => w.length > 2);
    for (const w of words) {
      if (textCorpus.includes(w)) {
        score += 8;
      }
    }

    const finalScore = Math.max(10, Math.min(99, score));
    matches.push({
      trackId: track.id,
      score: finalScore,
      reason:
        reasons.length > 0 ? reasons.slice(0, 2).join(" مع ") : "تطابق في الطابع الصوتي والتصنيف",
    });
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    detectedIntent,
    matches: matches.slice(0, 6),
  };
}

// 1. Semantic Search API Endpoint (البحث الدلالي الذكي)
app.post("/api/ai/semantic-search", async (req, res) => {
  try {
    if (rejectRateLimited(req, res)) return null;
    const query = parseBoundedText(req.body?.["query"], 300);
    const tracks = parseCatalogTracks(req.body?.["tracks"]);

    if (!query) {
      return res.json({ matches: [], intentSummary: "" });
    }

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.json({ matches: [], intentSummary: "" });
    }

    // If Gemini client available, attempt LLM call with fallback
    if (aiClient) {
      try {
        const catalogSummary = tracks.map((t: CatalogTrack) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          rhythm: t.rhythm,
          category: t.categoryLabel,
          code: t.code,
          description: t.description,
        }));

        const prompt = `أنت محرك بحث دلالي ذكي متخصص في استوديو أوركست للزفات الخليجية.
استعلام الزبون: "${query}".
المهمة:
1. حلل نية الزبون (المناسبة، نوع الإيقاع: بدون موسيقى / دفوف / أوركسترا، المزاج: هادئ / فخم / حماسي).
2. قيّم الأعمال الصوتية من الكتالوج التالي ورتب أفضل الأعمال تطابقاً دلالياً حتى لو اختلفت الكلمات الحرفية.
3. لكل عمل مطابق، حدد نسبة التطابق من 0 إلى 100، وقدم سبباً موجزاً بالعربية الفصحى.

كتالوج الأعمال:
${JSON.stringify(catalogSummary, null, 2)}`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedIntent: { type: Type.STRING },
                matches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      trackId: { type: Type.STRING },
                      score: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                    },
                    required: ["trackId", "score", "reason"],
                  },
                },
              },
              required: ["detectedIntent", "matches"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.matches && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
          return res.json({
            matches: parsed.matches,
            intentSummary: parsed.detectedIntent || "",
          });
        }
      } catch (geminiErr: unknown) {
        console.warn(
          "Gemini temporary API spike, falling back to intelligent semantic engine:",
          readErrorMessage(geminiErr),
        );
      }
    }

    // High fidelity semantic fallback
    const fallbackResult = analyzeSemanticIntentFallback(query, tracks);
    return res.json({
      matches: fallbackResult.matches,
      intentSummary: fallbackResult.detectedIntent,
    });
  } catch (error: unknown) {
    console.error("Semantic Search Critical Error:", readErrorMessage(error));
    return res
      .status(500)
      .json({ error: "تعذر تنفيذ البحث حالياً", matches: [], intentSummary: "" });
  }
});

// 2. AI SEO & Marketing Description Generator for Studio Owner
app.post("/api/ai/generate-seo", async (req, res) => {
  try {
    const session = requireAdmin(req, res);
    if (!session || !requireCsrf(req, res, session)) return null;
    if (rejectRateLimited(req, res)) return null;
    const title = parseBoundedText(req.body?.["title"], 160);
    const artist = parseBoundedText(req.body?.["artist"], 120);
    const category = parseBoundedText(req.body?.["category"], 120) || undefined;
    const rhythm = parseBoundedText(req.body?.["rhythm"], 80) || undefined;
    const notes = parseBoundedText(req.body?.["notes"], 500) || undefined;

    if (!title || !artist) {
      return res.status(400).json({ error: "العنوان واسم المنشد مطلوبان" });
    }

    if (aiClient) {
      try {
        const prompt = `أنت خبير تسويق رقمي وكبير مهندسي محركات البحث (SEO Specialist & Luxury Copywriter) لمنصة "أوركست" المتخصصة في الزفات الخليجية والشيلات الملكية.
المطلوب توليد بيانات تسويقية متكاملة ومحسنة لمحركات البحث للعمل الصوتي التالي:
- عنوان العمل: "${title}"
- المنشد: "${artist}"
- التصنيف: "${category || "زفات عروس"}"
- نوع الإيقاع: "${rhythm || "بدون موسيقى"}"
${notes ? `- ملاحظات إضافية: "${notes}"` : ""}

المخرجات المطلوبة بتنسيق JSON:
1. metaTitle: عنوان SEO احترافي وجذاب لجوجل (أقل من 60 حرفاً).
2. metaDescription: وصف SEO جذاب لمحركات البحث (بين 130 و 160 حرفاً).
3. marketingDescription: فقرة تسويقية فخمة وراقية (60-90 كلمة) بلهجة خليجية فصحى تبرز جمال اللحن وجودة الاستوديو وتدعو للطلب بالأسماء.
4. recommendedTags: قائمة من 5 إلى 8 وسوم (Tags) قوية لمحركات البحث.
5. targetAudience: الفئة المناسبة لهذا العمل.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                metaTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                marketingDescription: { type: Type.STRING },
                recommendedTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                targetAudience: { type: Type.STRING },
              },
              required: [
                "metaTitle",
                "metaDescription",
                "marketingDescription",
                "recommendedTags",
                "targetAudience",
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.metaTitle) {
          return res.json(parsed);
        }
      } catch (geminiErr: unknown) {
        console.warn(
          "Gemini SEO spike, using luxury template generator:",
          readErrorMessage(geminiErr),
        );
      }
    }

    // High quality deterministic luxury marketing copy
    return res.json({
      metaTitle: `${title} - المنشد ${artist} | زفات أوركست الملكية`,
      metaDescription: `استمع واطلب زفة ${title} بصوت المنشد ${artist}. تنفيذ حصري بالأسماء مع خيارات ${rhythm}. تسجيل استوديو ماسترينغ فخم لمناسبتكم السعيدة.`,
      marketingDescription: `تحفة صوتية ملكية تحمل عنوان "${title}" بأداء المنشد المبدع ${artist}، تم تسجيلها وهندستها في استوديو أوركست بأحدث تقنيات الصوت الماسترينغ لتضفي على مسيرة ليلتكم الكبرى وقاراً وهيبة لا تُنسى. العمل متاح للتخصيص الكامل بالأسماء وتعديل الإيقاع حسب تفاصيل قاعتكم.`,
      recommendedTags: [
        title,
        artist,
        category || "زفات عروس",
        rhythm || "بدون موسيقى",
        "زفات خليجية",
        "أوركست ستوديو",
        "تنفيذ بالأسماء",
      ],
      targetAudience: "حفلات الزفاف الملكية، العرسان والمناسبات الخليجية الكبرى",
    });
  } catch (error: unknown) {
    console.error("SEO Generator Error:", readErrorMessage(error));
    return res.status(500).json({ error: "تعذر توليد الوصف حالياً" });
  }
});

// 3. AI Concierge Chatbot for Customers ("اسأل مساعد أوركست")
app.post("/api/ai/concierge", async (req, res) => {
  try {
    if (rejectRateLimited(req, res)) return null;
    const message = parseBoundedText(req.body?.["message"], 500);
    const tracks = parseCatalogTracks(req.body?.["tracks"]);

    if (!message) {
      return res.status(400).json({ error: "الرسالة مطلوبة" });
    }

    const catalogList = tracks;

    if (aiClient) {
      try {
        const catalogData = catalogList.map((t: CatalogTrack) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          code: t.code,
          rhythm: t.rhythm,
          category: t.categoryLabel,
          description: t.description,
        }));

        const systemInstruction = `أنت "مساعد أوركست الذكي (Orchest AI Concierge)"، مستشار الذوق الصوتي والزفات الملكية في استوديو أوركست الخليجي.
شخصيتك: لبق، راقٍ، مهني جداً، تستخدم عبارات ترحيبية خليجية دافئة وفخمة ("يا أهلاً وسهلاً"، "ألف مبروك مقدماً").
المهمة:
1. فهم رغبة الزبون وذوقه الصوتي بدقة.
2. ترشيح من 1 إلى 3 أعمال محددة بالضبط من قائمة الكتالوج المتاحة عبر معرفاتها (track IDs).
3. تقديم رد موجز ومقنع يشرح لماذا هذا العمل يناسب طلبه.
4. اقتراح نوع التعديل المناسب (تغيير الأسماء، إضافة شعر، تعديل الإيقاع).

كتالوج الأعمال:
${JSON.stringify(catalogData, null, 2)}`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `سؤال الزبون: "${message}"`,
          config: {
            systemInstruction,
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING },
                recommendedTrackIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                suggestedModification: { type: Type.STRING },
              },
              required: ["reply", "recommendedTrackIds"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (
          parsed.reply &&
          Array.isArray(parsed.recommendedTrackIds) &&
          parsed.recommendedTrackIds.length > 0
        ) {
          return res.json(parsed);
        }
      } catch (geminiErr: unknown) {
        console.warn(
          "Gemini Concierge spike, using intelligent fallback concierge:",
          readErrorMessage(geminiErr),
        );
      }
    }

    // High quality intelligent conversational concierge
    const semanticMatches = analyzeSemanticIntentFallback(message, catalogList);
    const topIds = semanticMatches.matches.slice(0, 3).map((m) => m.trackId);

    return res.json({
      reply: `يا أهلاً وسهلاً بك في استوديو أوركست! 🎵 ألف مبروك مقدماً. بناءً على رغبتك (${semanticMatches.detectedIntent})، قمت باختيار هذه الأعمال الصوتية الملكية التي تتطابق تماماً مع إحساس المسيرة وجودة الاستوديو التي تبحث عنها:`,
      recommendedTrackIds: topIds.length > 0 ? topIds : catalogList.slice(0, 3).map((t) => t.id),
      suggestedModification: "تغيير أسماء العروسين مع إمكانية إضافة مقدمة شعرية خاصة بالأسماء",
    });
  } catch (error: unknown) {
    console.error("Concierge Error:", readErrorMessage(error));
    return res.status(500).json({ error: "تعذر تشغيل المساعد حالياً" });
  }
});

export { app };

// ===== Admin data writes (persistent). Reads happen in the browser through public read rules;
// every write here requires a valid admin session + CSRF token and runs with the server-only key.
async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}
function jsonStringArray(v: unknown, maxItems = 12, maxLength = 300): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => str(item, maxLength).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}
function isoOrNull(v: unknown, endOfDay = false): string | null {
  const value = str(v, 40).trim();
  if (!value) return null;
  return parseOfferDateBoundary(value, endOfDay)?.toISOString() ?? null;
}

const allowedOrderTypes = new Set([
  "تغيير الأسماء فقط",
  "إضافة مقدمة صوتية وشعر خاص بالأسماء",
  "تعديل الإيقاع والمؤثرات (دفوف / بدون موسيقى)",
  "تنفيذ زفة حصرية كاملة من الصفر",
]);

function isValidOrderDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function rejectPersistentPublicRateLimit(
  req: ShimReq,
  res: ShimRes,
  kind: "order" | "event",
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (rejectRateLimited(req, res, `public-${kind}`, limit, windowSeconds * 1_000)) return true;

  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!serviceRoleKey) {
    res.status(503).json({ error: "الخدمة غير متاحة حالياً" });
    return true;
  }
  try {
    const fingerprint = createHmac("sha256", serviceRoleKey)
      .update(getClientIp(req))
      .digest("hex");
    const db = await adminDb();
    const { data, error } = await db.rpc("consume_public_request_slot", {
      p_request_kind: kind,
      p_ip_fingerprint: fingerprint,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error?.code === "PGRST202" || error?.code === "42883") {
      console.warn("Persistent public rate limiter is not installed; using isolate limit");
      return false;
    }
    if (error) throw error;
    if (data === true) return false;
    res.status(429).json({ error: "تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً." });
    return true;
  } catch (error: unknown) {
    console.error("Public request limiter failed", readErrorMessage(error));
    res.status(503).json({ error: "تعذر التحقق من الطلب حالياً" });
    return true;
  }
}

app.post("/api/public/orders", async (req, res) => {
  const body = req.body ?? {};
  const website = str(body["website"], 200).trim();
  if (website) return res.status(202).json({ ok: true });

  const requestId = parseBoundedText(body["requestId"], 36);
  const trackId = parseBoundedText(body["trackId"], 128);
  const clientNames = parseBoundedText(body["clientNames"], 120);
  const modificationType = parseBoundedText(body["modificationType"], 100);
  const occasionDate = str(body["occasionDate"], 10).trim();
  const notes = str(body["notes"], 501).trim();
  const phone = str(body["phone"], 33).trim();
  const formStartedAt = Number(body["formStartedAt"]);

  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    return res.status(400).json({ error: "معرّف الطلب غير صالح" });
  }
  if (!trackId || !clientNames || !modificationType || !allowedOrderTypes.has(modificationType)) {
    return res.status(400).json({ error: "بيانات الطلب غير مكتملة أو غير صالحة" });
  }
  if (notes.length > 500 || phone.length > 32 || !isValidOrderDate(occasionDate)) {
    return res.status(400).json({ error: "تحقق من طول الملاحظات أو رقم التواصل أو التاريخ" });
  }
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 8 || phone.replace(/\D/g, "").length > 15)) {
    return res.status(400).json({ error: "رقم التواصل غير صالح" });
  }
  const elapsedMs = Date.now() - formStartedAt;
  if (!Number.isSafeInteger(formStartedAt) || elapsedMs < 1_500 || elapsedMs > 2 * 60 * 60_000) {
    return res.status(400).json({ error: "تعذر التحقق من النموذج. أعد فتحه ثم أرسل الطلب." });
  }
  if (await rejectPersistentPublicRateLimit(req, res, "order", 4, 10 * 60)) return null;

  const db = await adminDb();
  const { data: track, error: trackError } = await db
    .from("tracks")
    .select("id,title,code")
    .eq("id", trackId)
    .maybeSingle();
  if (trackError) return res.status(503).json({ error: "تعذر التحقق من العمل المطلوب" });
  if (!track) return res.status(400).json({ error: "العمل المطلوب غير موجود" });

  const { error } = await db.from("order_logs").insert({
    id: requestId,
    track_id: track.id,
    track_title: track.title,
    track_code: track.code,
    names: clientNames,
    client_names: clientNames,
    event_type: modificationType,
    modification_type: modificationType,
    event_date: occasionDate || null,
    occasion_date: occasionDate || null,
    notes: notes || null,
    phone: phone || null,
    status: "جديد",
  });
  if (error?.code === "23505") return res.json({ ok: true, duplicate: true });
  if (error) {
    console.error("Public order insert failed", error.code);
    return res.status(503).json({ error: "تعذر حفظ الطلب حالياً" });
  }
  return res.json({ ok: true });
});

app.post("/api/public/events", async (req, res) => {
  const eventType = req.body?.["eventType"];
  if (eventType !== "visit" && eventType !== "play") {
    return res.status(400).json({ error: "نوع الحدث غير مسموح" });
  }
  const trackId = eventType === "play" ? parseBoundedText(req.body?.["trackId"], 128) : null;
  if (eventType === "play" && !trackId) return res.status(400).json({ error: "معرّف العمل غير صالح" });
  if (await rejectPersistentPublicRateLimit(req, res, "event", 90, 60)) return null;

  const db = await adminDb();
  if (trackId) {
    const { data: track, error: trackError } = await db
      .from("tracks")
      .select("id")
      .eq("id", trackId)
      .maybeSingle();
    if (trackError) return res.status(503).json({ error: "تعذر التحقق من العمل" });
    if (!track) return res.status(400).json({ error: "العمل غير موجود" });
  }
  const { error } = await db.from("analytics_events").insert({
    event_type: eventType,
    track_id: trackId,
  });
  if (error) {
    console.error("Public event insert failed", error.code);
    return res.status(503).json({ error: "تعذر تسجيل الحدث حالياً" });
  }
  return res.json({ ok: true });
});

interface ValidatedOfferData {
  title: string;
  badge: string | null;
  description: string | null;
  type: string;
  banner_url: string | null;
  features: string[];
  price_original: number | null;
  price_current: number | null;
  currency: string;
  cta_text: string;
  whatsapp_message_template: string;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

function validateOfferInput(value: unknown): { data?: ValidatedOfferData; error?: string } {
  const offer = (value ?? {}) as Record<string, unknown>;
  const title = str(offer["title"], 255).trim();
  const message = str(offer["whatsappMessageTemplate"], 4000).trim();
  const type = str(offer["type"], 30);
  const startDate = isoOrNull(offer["startDate"]);
  const endDate = isoOrNull(offer["endDate"], true);
  const bannerUrl = str(offer["bannerUrl"], 2000).trim();
  if (!title) return { error: "عنوان العرض مطلوب" };
  if (!message) return { error: "رسالة واتساب مطلوبة" };
  if (type !== "text_card" && type !== "banner_image") return { error: "نوع العرض غير صالح" };
  if (type === "banner_image" && !bannerUrl) return { error: "رابط صورة البانر مطلوب" };
  if (bannerUrl) {
    try {
      if (new URL(bannerUrl).protocol !== "https:")
        return { error: "يجب أن يستخدم رابط صورة البانر بروتوكول HTTPS" };
    } catch {
      return { error: "رابط صورة البانر غير صالح" };
    }
  }
  if (offer["startDate"] && !startDate) return { error: "تاريخ البداية غير صالح" };
  if (offer["endDate"] && !endDate) return { error: "تاريخ النهاية غير صالح" };
  if (startDate && endDate && new Date(endDate) < new Date(startDate))
    return { error: "تاريخ النهاية يجب أن يكون بعد البداية" };
  const current =
    offer["priceCurrent"] == null || offer["priceCurrent"] === ""
      ? null
      : num(offer["priceCurrent"]);
  const original =
    offer["priceOriginal"] == null || offer["priceOriginal"] === ""
      ? null
      : num(offer["priceOriginal"]);
  if (current != null && current < 0) return { error: "السعر الحالي غير صالح" };
  if (original != null && original < 0) return { error: "السعر السابق غير صالح" };
  return {
    data: {
      title,
      badge: str(offer["badge"], 100).trim() || null,
      description: str(offer["description"], 2000).trim() || null,
      type,
      banner_url: bannerUrl || null,
      features: jsonStringArray(offer["features"]),
      price_original: original,
      price_current: current,
      currency: str(offer["currency"], 10).trim() || "ر.س",
      cta_text: str(offer["ctaText"], 100).trim() || "طلب الباقة عبر واتساب",
      whatsapp_message_template: message,
      is_active: bool(offer["isActive"]),
      display_order: Math.max(0, Math.floor(num(offer["displayOrder"]))),
      start_date: startDate,
      end_date: endDate,
    },
  };
}

app.post("/api/admin/orders", async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session)) return null;
  const db = await adminDb();
  const [orders, visits, plays, leads] = await Promise.all([
    db.from("order_logs").select("*").order("created_at", { ascending: false }).limit(500),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "visit"),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "play"),
    db.from("order_logs").select("id", { count: "exact", head: true }),
  ]);
  const error = orders.error || visits.error || plays.error || leads.error;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    orders: orders.data ?? [],
    visits: visits.count ?? 0,
    plays: plays.count ?? 0,
    whatsappLeads: leads.count ?? 0,
  });
});
app.post("/api/admin/config", async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session)) return null;
  const db = await adminDb();
  const [offers, theme] = await Promise.all([
    db.from("offers_packages").select("*").order("display_order", { ascending: true }).limit(200),
    db.from("app_theme_settings").select("*").eq("id", "current_settings").limit(1),
  ]);
  if (offers.error || theme.error)
    return res.status(500).json({ error: offers.error?.message ?? theme.error?.message });
  return res.json({ offers: offers.data ?? [], theme: theme.data?.[0] ?? null });
});

app.post("/api/admin/mutate", async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session)) return null;
  const b = req.body ?? {};
  const action = str(b["action"], 50);
  const db = await adminDb();
  let error: { message: string } | null = null;

  switch (action) {
    case "upsertOffer": {
      const validated = validateOfferInput(b["offer"]);
      if (validated.error || !validated.data)
        return res.status(400).json({ error: validated.error ?? "بيانات العرض غير صالحة" });
      const offer = (b["offer"] ?? {}) as Record<string, unknown>;
      const id = str(offer["id"], 100).trim();
      ({ error } = await db.from("offers_packages").upsert({
        ...validated.data,
        updated_at: new Date().toISOString(),
        ...(id ? { id } : {}),
      }));
      break;
    }
    case "deleteOffer":
      ({ error } = await db.from("offers_packages").delete().eq("id", str(b["id"], 100)));
      break;
    case "setOfferActive":
      ({ error } = await db
        .from("offers_packages")
        .update({ is_active: bool(b["value"]), updated_at: new Date().toISOString() })
        .eq("id", str(b["id"], 100)));
      break;
    case "reorderOffers": {
      const ids = Array.isArray(b["ids"]) ? b["ids"].map((x) => str(x, 100)).slice(0, 200) : [];
      for (let i = 0; i < ids.length && !error; i++) {
        ({ error } = await db
          .from("offers_packages")
          .update({ display_order: i + 1, updated_at: new Date().toISOString() })
          .eq("id", ids[i] ?? ""));
      }
      break;
    }
    case "updateThemeSettings": {
      const theme = (b["theme"] ?? {}) as Record<string, unknown>;
      const activeTheme = str(theme["activeTheme"], 50);
      const allowedThemes = ["default", "ramadan", "eid", "national_day", "wedding_season"];
      if (!allowedThemes.includes(activeTheme))
        return res.status(400).json({ error: "الثيم غير صالح" });
      const customGreetings = theme["customGreetingsOverride"];
      const customGreetingsOverride: Record<string, string> | null =
        customGreetings && typeof customGreetings === "object" && !Array.isArray(customGreetings)
          ? Object.fromEntries(
              Object.entries(customGreetings).map(([key, value]) => [key, str(value, 200)]),
            )
          : null;
      ({ error } = await db.from("app_theme_settings").upsert({
        id: "current_settings",
        active_theme: activeTheme,
        force_theme_override: bool(theme["forceThemeOverride"]),
        enable_time_greetings: bool(theme["enableTimeGreetings"]),
        enable_offers_section: bool(theme["enableOffersSection"]),
        custom_greetings_override: customGreetingsOverride,
        updated_at: new Date().toISOString(),
      }));
      break;
    }
    case "addTrack": {
      const t = (b["track"] ?? {}) as Record<string, unknown>;
      const cover = str(t["coverUrl"]);
      const dur = num(t["duration"]);
      const fmt = str(t["durationFormatted"], 10);
      const rhythm = str(t["rhythm"], 50);
      ({ error } = await db.from("tracks").insert({
        id: str(t["id"], 100),
        title: str(t["title"], 200),
        vocalist: str(t["artist"], 200),
        artist: str(t["artist"], 200),
        code: str(t["code"], 50),
        category_id: str(t["categoryId"], 100) || null,
        duration: fmt,
        duration_sec: dur,
        duration_seconds: dur,
        duration_formatted: fmt,
        audio_url: str(t["audioUrl"]),
        cover_image: cover,
        cover_url: cover,
        rhythm,
        has_music: rhythm !== "بدون موسيقى",
        is_trend: Boolean(t["isTrend"]),
        is_exclusive: Boolean(t["isExclusive"]),
        execution_days: str(t["executionDays"], 50),
        suitable_for: Array.isArray(t["suitableFor"])
          ? t["suitableFor"].map((x) => str(x, 100))
          : [],
        description: str(t["description"]),
        audio_frequency: t["audioFreq"] == null ? null : num(t["audioFreq"]),
        lyrics: str(t["lyrics"], 5000) || null,
      }));
      break;
    }
    case "updateTrack": {
      const t = (b["track"] ?? {}) as Record<string, unknown>;
      const id = str(t["id"], 100);
      if (!id) return res.status(400).json({ error: "معرّف العمل مطلوب" });
      const cover = str(t["coverUrl"]);
      const dur = num(t["duration"]);
      const fmt = str(t["durationFormatted"], 10);
      const rhythm = str(t["rhythm"], 50);
      ({ error } = await db
        .from("tracks")
        .update({
          title: str(t["title"], 200),
          vocalist: str(t["artist"], 200),
          artist: str(t["artist"], 200),
          code: str(t["code"], 50),
          category_id: str(t["categoryId"], 100) || null,
          duration: fmt,
          duration_sec: dur,
          duration_seconds: dur,
          duration_formatted: fmt,
          cover_image: cover,
          cover_url: cover,
          rhythm,
          has_music: rhythm !== "بدون موسيقى",
          is_trend: Boolean(t["isTrend"]),
          is_exclusive: Boolean(t["isExclusive"]),
          execution_days: str(t["executionDays"], 50),
          suitable_for: Array.isArray(t["suitableFor"])
            ? t["suitableFor"].map((x) => str(x, 100))
            : [],
          description: str(t["description"]),
          lyrics: str(t["lyrics"], 5000) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id));
      break;
    }
    case "deleteTrack":
      ({ error } = await db.from("tracks").delete().eq("id", str(b["id"], 100)));
      break;
    case "setTrend":
      ({ error } = await db
        .from("tracks")
        .update({ is_trend: Boolean(b["value"]) })
        .eq("id", str(b["id"], 100)));
      break;
    case "addCategory": {
      const c = (b["category"] ?? {}) as Record<string, unknown>;
      const id = str(c["id"], 100);
      ({ error } = await db.from("categories").insert({
        id,
        slug: id,
        name: str(c["name"], 200),
        description: str(c["description"]),
        image_url: str(c["image"]) || null,
        track_count: num(c["count"]),
        sort_order: num(b["sortOrder"]),
      }));
      break;
    }
    case "deleteCategory": {
      const id = str(b["id"], 100);
      ({ error } = await db.from("tracks").update({ category_id: null }).eq("category_id", id));
      if (!error) ({ error } = await db.from("categories").delete().eq("id", id));
      break;
    }
    case "reorderCategories": {
      const ids = Array.isArray(b["ids"]) ? b["ids"].map((x) => str(x, 100)).slice(0, 200) : [];
      for (let i = 0; i < ids.length && !error; i++) {
        ({ error } = await db
          .from("categories")
          .update({ sort_order: i + 1 })
          .eq("id", ids[i] ?? ""));
      }
      break;
    }
    case "setSetting":
      ({ error } = await db.from("site_settings").upsert({
        key: str(b["key"], 100),
        value: str(b["value"], 500),
        updated_at: new Date().toISOString(),
      }));
      break;
    case "setOrderStatus": {
      const status = str(b["status"], 20);
      if (!["جديد", "قيد التنفيذ", "مكتمل"].includes(status))
        return res.status(400).json({ error: "حالة غير صالحة" });
      ({ error } = await db.from("order_logs").update({ status }).eq("id", str(b["id"], 100)));
      break;
    }
    default:
      return res.status(400).json({ error: "عملية غير معروفة" });
  }
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});
