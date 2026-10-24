# 📦 وثيقة التوثيق والتسليم — Orchest Studio

**تاريخ الإصدار:** 24 أكتوبر 2026
**الإصدار:** v1.0 — Release Candidate
**المستودع:** `r7-yn/studio-bond`
**الفرع الرئيسي:** `main`

> **تحديث التسليم — 24 أكتوبر 2026**
> تم مزامنة commit `3a4426d` محلياً والتحقق من `npm ci` وTypeScript والاختبارات (24/24) وproduction build. تم اعتماد شعار العميل في أصول الموقع، وإضافة `og-image.jpg` وأيقونات PWA، وتحديث وثيقة المعمارية، وإضافة migration تصحيحية للقيود. تم تطبيق migrations المطلوبة والتحقق من الجداول والقيود في Supabase؛ لا تزال Vercel تحتاج الأسرار والنطاق وصلاحية النشر.


---

## 1. ملخص تنفيذي

أوركست (Orchest Studio) منصة ويب عربية RTL لإنتاج وعرض الزفات الخليجية والشيلات الملكية، تُمكّن العملاء من الاستماع إلى الأعمال الصوتية وطلب تنفيذ مخصص بالأسماء عبر واتساب بخطوات بسيطة، كما تُوفّر لصاحب الاستوديو لوحة إدارة متكاملة لرفع الأعمال وتتبع الطلبات وتحليل الأداء.

### الحالة الراهنة
| البُعد | القيمة |
|---|---|
| الحالة | Release Candidate — كود مكتمل، يحتاج إعداد بيئة إنتاج |
| TypeScript | ✅ يمر بدون أخطاء |
| الاختبارات | ✅ 24 اختباراً في 5 ملفات (unit) |
| البناء | ✅ Vite + Nitro يبنيان بنجاح |
| ESLint | ⚠️ 1,078 مشكلة في ملفات legacy/generated |
| قاعدة البيانات (Supabase) | ✅ الجداول والقيود المطلوبة مطبقة؛ backup تشغيلي مطلوب قبل الإنتاج |

---

## 2. البنية التقنية الكاملة

### Stack

| الطبقة | التقنية | الإصدار | الدور |
|---|---|---|---|
| **Frontend Framework** | TanStack Start | 1.168.x | SSR + Client Routing |
| **Router** | TanStack Router | 1.170.x | File-based routing |
| **UI Library** | React | 19.2.x | Component rendering |
| **Styling** | Tailwind CSS | 4.2.x | Utility-first CSS |
| **Build Tool** | Vite | 8.1.x | Dev server + Bundler |
| **Server** | Nitro | 3.x | SSR + API handlers |
| **Database** | Supabase (PostgreSQL) | — | Persistent data store |
| **Auth** | HMAC-signed tokens | — | Admin-only, stateless |
| **Storage** | Supabase Storage | — | Audio + Images |
| **AI** | Lovable AI Gateway (Gemini) | — | Semantic search + Admin assistant |
| **PWA** | Service Worker + Web Push | — | Installable app + Push notifications; Vercel Node runtime |
| **Testing** | Vitest + jsdom | 4.x | Unit testing |

### هيكل المجلدات

```
studio-bond/
├── docs/
│   ├── PRD.md                  # مستند متطلبات المنتج
│   ├── ARCHITECTURE.md         # وثيقة المعمارية (تحتاج تحديث)
│   └── DESIGN_SYSTEM.md        # نظام التصميم والألوان والتايبوغرافي
│
├── src/
│   ├── orchest/                # تطبيق أوركست الرئيسي
│   │   ├── App.tsx             # Root component — حالة التطبيق الكاملة
│   │   ├── components/         # 24 مكوناً UI
│   │   │   ├── AdminDashboard.tsx    # لوحة الإدارة الكاملة
│   │   │   ├── StickyAudioPlayer.tsx # المشغل الصوتي العائم
│   │   │   ├── OrderModal.tsx        # نافذة الطلب الذكية (3 خطوات)
│   │   │   ├── TrackCard.tsx         # بطاقة العمل الصوتي
│   │   │   ├── TrackDetailsView.tsx  # صفحة تفاصيل العمل
│   │   │   ├── SearchModal.tsx       # البحث الدلالي
│   │   │   ├── AiConciergeModal.tsx  # المساعد الذكي للزبون
│   │   │   ├── AdminAssistantPanel.tsx # مساعد AI للمدير
│   │   │   ├── GiftDeliveryPanel.tsx   # بطاقة التسليم الصوتية
│   │   │   ├── OffersAdminPanel.tsx    # إدارة العروض
│   │   │   ├── YouTubeImportPanel.tsx  # استيراد من YouTube
│   │   │   └── PwaNotificationsPanel.tsx # إعدادات الإشعارات
│   │   ├── server/
│   │   │   ├── api.ts          # جميع API handlers (Express-like)
│   │   │   └── shim.ts         # Express shim + AI gateway client
│   │   ├── services/
│   │   │   ├── catalogDb.ts    # Public data reads + order inserts
│   │   │   ├── audioEngine.ts  # Audio playback state machine
│   │   │   ├── adminAssistant.ts
│   │   │   ├── adminPush.ts
│   │   │   ├── giftDelivery.ts
│   │   │   ├── mediaUpload.ts
│   │   │   └── youtubeIntegration.ts
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   └── utils/
│   │       ├── trackLogic.ts   # Filtering, WhatsApp URL, export
│   │       ├── adminAuth.ts    # Admin headers helper
│   │       ├── cultural.ts     # Arabic cultural utilities
│   │       ├── offerLogic.ts   # Offer date/boundary logic
│   │       └── orderSteps.ts   # Order flow validation
│   │
│   ├── routes/
│   │   ├── __root.tsx          # Root layout + SEO meta
│   │   ├── index.tsx           # "/" — loads OrchestApp
│   │   ├── gift/               # /gift/:token — Gift delivery page
│   │   └── api/                # API catch-all → shim dispatch
│   │
│   ├── pwa/
│   │   └── PwaRuntime.tsx      # SW registration + install prompt
│   │
│   ├── styles.css              # Orchest design tokens + Tailwind
│   └── integrations/
│       └── supabase/           # Supabase client + generated types
│
├── public/
│   ├── sw.js                   # Service Worker
│   ├── site.webmanifest        # PWA Manifest
│   ├── offline.html            # Offline fallback page
│   ├── robots.txt              # SEO: blocks /api/, /gift/, admin
│   ├── icon-192.png            # PWA icon
│   ├── icon-512.png            # PWA icon from approved studio logo
│   ├── logo-studio-orchest.jpg   # Approved full studio logo
│   ├── og-image.jpg               # 1200×630 social preview
│   └── favicon.ico
│
├── supabase/
│   └── migrations/             # 11 migration files
│
├── scripts/
│   └── generate-seo-assets.mjs # Postbuild: sitemap.xml + robots
│
├── docs/                       # Product documentation
├── .env.example                # Environment variables template
├── vite.config.ts              # Vite + TanStack config
├── package.json
└── tsconfig.json
```

---

## 3. قاعدة البيانات (Supabase)

### المشروع
| المعلومة | القيمة |
|---|---|
| Project ID | `ktkzinhogzhaecspkzlc` |
| المنطقة | حسب إعداد المشروع |
| الحالة | ACTIVE_HEALTHY |

### الجداول الرئيسية

| الجدول | الوصف | RLS |
|---|---|---|
| `tracks` | كتالوج الأعمال الصوتية | عام للقراءة |
| `categories` | تصنيفات الأعمال | عام للقراءة |
| `artists` | بيانات الفنانين | عام للقراءة |
| `order_logs` | طلبات العملاء عبر واتساب | Insert-only للعام |
| `site_settings` | إعدادات الموقع (رقم واتساب) | عام للقراءة |
| `offers_packages` | العروض والباقات | عام للقراءة |
| `app_theme_settings` | إعدادات المظهر | عام للقراءة |
| `analytics_events` | أحداث التتبع والتحليل | Insert-only للعام |
| `orchest_admin_users` | قائمة مديري الاستوديو (**pending migration**) | خادمي |
| `gift_deliveries` | بطاقات التسليم الصوتية (**pending migration**) | خادمي |
| `push_subscriptions` | اشتراكات Web Push (**pending migration**) | خادمي |
| `admin_youtube_connections` | ربط YouTube OAuth (**pending migration**) | خادمي |

### Migrations المطبقة والتحقق منها

تم تطبيق migrations المطلوبة على المشروع `ktkzinhogzhaecspkzlc` والتحقق من وجود جداول الإدارة والتكاملات والقيود. احتفظ بقائمة الملفات التالية كمصدر تاريخي وترتيب إعادة البناء.

```sql
-- 1. إضافة العروض وإعدادات الثيم
supabase/migrations/20261020031015_add_offers_and_theme_settings.sql

-- 2. تصحيح عدادات الكتالوج المبدئية
supabase/migrations/20261021021800_reconcile_seeded_catalog_metrics.sql

-- 3. تأمين إرسال الطلبات العامة
supabase/migrations/20261021022300_secure_public_submissions.sql

-- 4. إضافة خاصية نشر/إخفاء الأعمال
supabase/migrations/20261022100000_add_track_publication.sql

-- 5. إنشاء Storage bucket للوسائط
supabase/migrations/20261022102000_add_orchest_media_bucket.sql

-- 6. جداول التسليم الصوتي (gift_deliveries + bucket orchest-gifts)
supabase/migrations/20261023000000_orchest_admin_gift_delivery.sql

-- 7 و 8. تحديثات اللوحة والإدارة
supabase/migrations/20261023194804_ad4c3203-c8c2-46bb-b45a-a68e4637aabb.sql
supabase/migrations/20261023195122_b5674562-5941-4fd5-a0ac-cda635b88299.sql

-- 9. تكاملات المنصة (push_subscriptions, youtube_connections, ai_audit_logs)
supabase/migrations/20261024000000_platform_integrations.sql

-- 10. تقوية قيود تكاملات المنصة بعد التكرار التاريخي
supabase/migrations/20261024100000_harden_platform_integration_constraints.sql
```

---

## 4. متغيرات البيئة

### للتطوير المحلي (`.env`)

```bash
# Supabase — Browser Safe
VITE_SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Supabase — Server Only
SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin Session
ADMIN_SESSION_SECRET=<random-string-32-chars-minimum>

# Local development only — DO NOT set in production
ORCHEST_ALLOW_INSECURE_LOCAL_COOKIES=true

# Public URLs (اتركهما فارغين محلياً)
PUBLIC_SITE_URL=
VITE_PUBLIC_SITE_URL=

# AI (اختياري)
LOVABLE_API_KEY=

# YouTube OAuth (اختياري)
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/admin/youtube/callback

# Web Push (اختياري)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@localhost
```

### للإنتاج (Vercel Dashboard)

```bash
# ❌ لا تضع ORCHEST_ALLOW_INSECURE_LOCAL_COOKIES في Vercel
# ✅ اضبط هذه فقط:

VITE_SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SESSION_SECRET=<strong-random-secret>
PUBLIC_SITE_URL=https://your-domain.com
VITE_PUBLIC_SITE_URL=https://your-domain.com
LOVABLE_API_KEY=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=https://your-domain.com/api/admin/youtube/callback
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@your-domain.com
```

---

## 5. تدفق البيانات والأمان

> **Runtime decision:** تم تثبيت `nitro: { preset: "vercel" }` في `vite.config.ts` لأن Web Push يعتمد على Node crypto APIs.

### تدفق طلب الزبون (Public Flow)

```
1. المتصفح يقرأ قاعدة البيانات مباشرة (RLS: read-only)
   supabase.from("tracks").select("*")

2. الزبون يضغط تشغيل → AudioEngine يُحمّل audioUrl
   → analytics_events INSERT (play_event)

3. الزبون يضغط "اطلب باسمك" → OrderModal يُفتح

4. بعد إدخال البيانات → saveOrder() يُرسل لـ /api/orders
   → Server يتحقق من honeypot + timing + rate limit
   → order_logs INSERT (insert-only RLS)
   → WhatsApp URL يُفتح في المتصفح مباشرة

5. اختياري: Server يُرسل Web Push للمدير المشترك
```

### تدفق طلب المدير (Admin Flow)

```
1. /api/auth/login → يتحقق من Supabase Auth
   → يتحقق من وجود user_id في orchest_admin_users
   → يُصدر HMAC-signed session token في HttpOnly Cookie

2. كل طلب إداري:
   → Cookie تُرسل تلقائياً
   → Server يتحقق من signature + TTL + CSRF token
   → Service Role Client يُنفذ العملية

3. بعد ساعتين → الجلسة تنتهي تلقائياً
```

### مبادئ الأمان المُطبَّقة

| المبدأ | التطبيق |
|---|---|
| Least Privilege | الزوار يقرؤون فقط، الإدارة خادمية |
| Defense in Depth | Rate limit + Honeypot + CSRF + Size limit |
| Secrets in Server | Service key و Session secret لا تصل للمتصفح |
| Stateless Auth | HMAC tokens لا تُخزَّن في DB |
| Input Validation | كل طلب عام يُتحقق من حجمه وبياناته |

---

## 6. API Endpoints

### عامة (بدون مصادقة)

| الطريقة | المسار | الوصف |
|---|---|---|
| `GET` | `/api/auth/session` | حالة جلسة المدير |
| `POST` | `/api/orders` | حفظ طلب زبون جديد |
| `POST` | `/api/ai/semantic-search` | بحث دلالي في الكتالوج |
| `POST` | `/api/ai/concierge` | مساعد الزبون الذكي |
| `GET` | `/api/gifts/:token` | صفحة بطاقة التسليم |

### إدارية (تتطلب جلسة صالحة + CSRF)

| الطريقة | المسار | الوصف |
|---|---|---|
| `POST` | `/api/auth/login` | تسجيل دخول المدير |
| `POST` | `/api/auth/logout` | تسجيل خروج |
| `GET/POST` | `/api/admin/catalog` | إدارة الأعمال |
| `GET/POST` | `/api/admin/settings` | إعدادات الموقع |
| `GET` | `/api/admin/orders` | قراءة الطلبات |
| `GET` | `/api/admin/analytics` | الإحصاءات |
| `POST` | `/api/admin/backup` | تصدير النسخ الاحتياطية |
| `POST` | `/api/admin/ai/seo` | توليد SEO بالذكاء الاصطناعي |
| `POST` | `/api/admin/assistant` | مساعد المدير الداخلي |
| `GET/POST` | `/api/admin/gifts` | إدارة بطاقات التسليم |
| `GET/POST` | `/api/admin/push` | إدارة اشتراكات Push |
| `GET/POST` | `/api/admin/youtube` | ربط YouTube OAuth |
| `GET/POST` | `/api/admin/offers` | إدارة العروض |
| `GET/POST` | `/api/admin/artists` | إدارة الفنانين |
| `GET/POST` | `/api/admin/categories` | إدارة التصنيفات |

---

## 7. مكونات النظام الرئيسية

### المشغل الصوتي (AudioEngine + StickyAudioPlayer)

```typescript
// نمط Observer — AudioEngine يُبلّغ المكوّنات عند تغيير الحالة
const audioEngine = new AudioEngine();
audioEngine.subscribe((state) => { /* تحديث الـ UI */ });
audioEngine.play(track);     // تشغيل
audioEngine.togglePlay();    // إيقاف/تشغيل
audioEngine.seek(60);        // القفز لثانية 60
audioEngine.skip(10);        // تقديم 10 ثوانٍ
```

**الميزات:**
- Media Session API (lock screen controls)
- Swipe gesture للتنقل بين الأعمال على الجوال
- Fallback message عند غياب audioUrl
- Error handling مع رسالة عربية واضحة

---

### نافذة الطلب (OrderModal)

**الخطوات الثلاث:**
1. `أسماء العروسين والمناسبة` — clientNames + occasionDate
2. `نوع التعديل` — modificationType من قائمة محددة
3. `مراجعة وإرسال` — عرض ملخص + رابط واتساب

**حماية مدمجة:**
- Honeypot field مخفي
- Timing check (طلب سريع جداً = bot)
- Duplicate request ID prevention
- Rate limiting من الخادم

---

### لوحة الإدارة (AdminDashboard)

**الأقسام:**
- 📊 الإحصاءات والـ KPIs
- 🎵 إدارة الأعمال (إضافة/تعديل/حذف/نشر)
- 👥 إدارة الفنانين
- 📁 إدارة التصنيفات
- 📦 العروض والباقات
- 📋 الطلبات مع تصفية وبحث
- 🎁 بطاقات التسليم الصوتية
- 🤖 مساعد AI للمدير
- 📺 استيراد من YouTube
- 🔔 إعدادات الإشعارات
- ⚙️ الإعدادات العامة (واتساب + نسخ احتياطية)

---

## 8. تعليمات التشغيل والتطوير

### التشغيل المحلي

```bash
# 1. تثبيت المتطلبات
npm install

# 2. نسخ وتعديل متغيرات البيئة
cp .env.example .env
# عدّل .env بقيم Supabase الحقيقية

# 3. تشغيل server التطوير
npm run dev
# الموقع يعمل على: http://localhost:3000

# 4. تشغيل الاختبارات
npm test

# 5. بناء الإنتاج محلياً
npm run build
```

### النشر على Vercel

```bash
# الطريقة الأولى: من GitHub (مُوصى بها)
1. ربط المستودع بـ Vercel من vercel.com
2. ضبط متغيرات البيئة في Dashboard
3. كل push لـ main يُنشر تلقائياً

# الطريقة الثانية: Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

---

## 9. PWA وإشعارات Web Push

### تثبيت التطبيق

- **Android/Chrome:** يظهر زر "إضافة للشاشة الرئيسية" تلقائياً
- **iOS/Safari:** يدوياً: Share → "إضافة للشاشة الرئيسية"
- **Desktop:** أيقونة التثبيت في شريط العنوان

### إعداد Web Push للمدير

```bash
# 1. توليد VAPID Keys
npx web-push generate-vapid-keys

# 2. إضافة المفاتيح في Vercel:
VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
VAPID_SUBJECT=mailto:admin@your-domain.com

# 3. من لوحة الإدارة → الإعدادات → الإشعارات:
   - تفعيل الإشعارات
   - إرسال اختبار للتحقق
```

---

## 10. SEO والبحث

### ما هو جاهز

- HTML عربي كامل قبل تحميل JavaScript (مرئي للـ bots)
- Title + Description + OG + Twitter Card في كل صفحة
- JSON-LD Organization schema
- robots.txt يحجب المسارات الخاصة
- sitemap.xml يُنشأ تلقائياً بعد ضبط `PUBLIC_SITE_URL`

### ما يحتاج عمل إضافي بعد الإطلاق

```
1. إضافة الموقع في Google Search Console
2. إرسال sitemap.xml
3. فحص Core Web Vitals من PageSpeed Insights
4. مراقبة indexing وCTR شهرياً
5. بناء صفحات /tracks/[code] لفهرسة كل زفة منفردة
```

---

## 11. قائمة التسليم الكاملة

### ملفات التوثيق المُسلَّمة

| الملف | الوصف |
|---|---|
| `ANALYTICAL_REPORT.md` | تقرير تحليلي شامل للمشروع |
| `DELIVERY_DOCUMENT.md` | وثيقة التوثيق والتسليم (هذا الملف) |
| `PLATFORM_READINESS_REPORT.md` | تقرير جاهزية PWA وSEO والتكاملات |
| `VERIFICATION_REPORT.md` | تقرير التحقق الفني |
| `TODO.md` | قائمة المهام المتبقية |
| `plan.md` | خطة التطوير التفصيلية |
| `docs/PRD.md` | مستند متطلبات المنتج |
| `docs/ARCHITECTURE.md` | وثيقة المعمارية |
| `docs/DESIGN_SYSTEM.md` | نظام التصميم |
| `.env.example` | قالب متغيرات البيئة |

### الكود المُسلَّم

| المكوّن | الملفات |
|---|---|
| تطبيق أوركست الكامل | `src/orchest/` (App.tsx + 24 مكوّن + services + utils) |
| API Server | `src/orchest/server/api.ts` (~2,327 سطر) |
| Express Shim + AI Gateway | `src/orchest/server/shim.ts` |
| Routes | `src/routes/` (root + index + gift + api) |
| PWA Runtime | `src/pwa/PwaRuntime.tsx` |
| Styles | `src/styles.css` (Orchest design tokens) |
| Public Assets | `public/` (sw.js, manifest, icons, offline) |
| Migrations | `supabase/migrations/` (11 ملفات) |
| SEO Script | `scripts/generate-seo-assets.mjs` |
| Tests | `src/orchest/services/*.test.ts` + `src/orchest/utils/*.test.ts` |

---

## 12. المهام الحرجة قبل الإطلاق

> مرتّبة بالأولوية — يجب تنفيذها كلها قبل نشر المنصة على العملاء

```
☑ [منجز]  حذف allowedHosts sandbox من vite.config.ts
☐ [حرج]  أخذ backup تشغيلي موثق قبل أول استخدام إنتاجي
☑ [منجز]  يوجد حساب Admin مسجل في Supabase Auth وقائمة `orchest_admin_users`
☑ [منجز]  user_id للمدير موجود في جدول `orchest_admin_users`
☐ [حرج]  تفعيل Leaked Password Protection في Supabase
☐ [حرج]  ربط مشروع Vercel بمستودع `r7-yn/studio-bond` أو تأكيد أن المستودع الخاص هو المصدر الصحيح، ثم ضبط متغيرات البيئة
☑ [منجز]  ترجمة رسائل الخطأ (404, Error) للعربية
☑ [منجز]  إنشاء وإضافة og:image (1200×630px) من شعار الاستوديو المعتمد
☐ [مهم]  اختبار Preview deployment على Android + iOS
☐ [مهم]  اختبار تسجيل الدخول وصلاحيات الإدارة
☐ [مهم]  اختبار نافذة الطلب ورابط واتساب المُولَّد
☐ [مهم]  اختبار بطاقة التسليم + QR
☐ [مهم]  ضبط النطاق الحقيقي في Vercel
☐ [مفيد] تسجيل الموقع في Google Search Console
☐ [مفيد] إرسال sitemap.xml لـ Google
☐ [مفيد] توليد VAPID keys وتفعيل Web Push
```

---

## 13. جهات الاتصال والمراجع

### خدمات خارجية مُستخدَمة

| الخدمة | الدور | الرابط |
|---|---|---|
| Supabase | قاعدة البيانات + Auth + Storage | supabase.com |
| Vercel | الاستضافة والنشر | vercel.com |
| Lovable AI Gateway | الذكاء الاصطناعي (Gemini) | ai.gateway.lovable.dev |
| Google Fonts | Alexandria + Cairo | fonts.google.com |
| Upstash Redis (مقترح) | Rate Limiting موزع | upstash.com |

### مستندات مرجعية

- [TanStack Start Docs](https://tanstack.com/start)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Web Push VAPID Keys](https://web-push-book.gauntface.com/demos/notification-examples/)

---

*وثيقة التوثيق والتسليم — Orchest Studio v1.0*
*أُعدَّت بتاريخ 24 أكتوبر 2026*
