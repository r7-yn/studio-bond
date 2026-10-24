# 🎵 تقرير تحليلي شامل — Orchest Studio

**تاريخ التقرير:** 24 أكتوبر 2026
**المُعِدّ:** مراجعة تقنية متكاملة (Architecture · Code · Security · SEO · UX · Vercel)
**المستودع:** `r7-yn/studio-bond`

> **تحديث تنفيذي بعد مزامنة Antigravity وإغلاق الجولة الحالية — 24 أكتوبر 2026**
> تم التحقق من commit `3a4426d` محلياً، وإضافة أصول الشعار المرفق (`logo-studio-orchest.jpg`, `og-image.jpg`, وأيقونات PWA)، وتصحيح وثيقة المعمارية، وإضافة migration تصحيحية لقيود تكاملات المنصة. TypeScript والاختبارات والبناء ناجحة. تم تطبيق migrations المطلوبة على Supabase والتحقق من الجداول والقيود؛ المتبقي يعتمد على Vercel: ضبط الأسرار والنطاق، اختبار Preview/Production، وتفعيل حماية كلمات المرور المسربة.


---

## 📋 فهرس المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة)
2. [تقييم الفكرة والسوق](#2-تقييم-الفكرة-والسوق)
3. [الوضع الحالي للكود](#3-الوضع-الحالي-للكود)
4. [المشاكل والعيوب المكتشفة](#4-المشاكل-والعيوب-المكتشفة)
5. [تقييم الأمان](#5-تقييم-الأمان)
6. [تقييم SEO والأداء](#6-تقييم-seo-والأداء)
7. [جاهزية Vercel](#7-جاهزية-vercel)
8. [Critical Blockers قبل النشر](#8-critical-blockers)
9. [تحسينات مقترحة للتميز](#9-تحسينات-مقترحة)
10. [خارطة طريق التنفيذ](#10-خارطة-الطريق)
11. [التقييم الإجمالي](#11-التقييم-الإجمالي)

---

## 1. نظرة عامة على المشروع

| المحور | التفاصيل |
|---|---|
| **الاسم** | أوركست — Orchest Studio |
| **الفكرة** | منصة ويب عربية متخصصة بالزفات الخليجية والشيلات الملكية مع طلب مخصص بالأسماء عبر واتساب |
| **التقنية** | TanStack Start (SSR) + React 19 + Supabase + Tailwind CSS 4 + Vite 8 + Nitro |
| **الاستضافة** | Vercel (Node.js) — مُوصى به، أو Cloudflare Workers |
| **المرحلة** | Release Candidate — كود متكامل، ينتظر إعداد بيئة الإنتاج |

### المكونات المنجزة ✅

- مشغل صوتي عائم مستمر (StickyAudioPlayer) مع Media Session API وSwipe gesture
- نافذة طلب ذكية متعددة الخطوات (3 خطوات) تُحوّل للواتساب
- لوحة إدارة شاملة (~100 KB كود) مع مساعد AI داخلي
- بحث دلالي بالذكاء الاصطناعي (AI Semantic Search + AI Concierge)
- PWA كاملة: Service Worker + Web Push + Install Prompt
- Dark / Light mode بـ CSS tokens مُتزامنة مع localStorage
- بطاقة التسليم الصوتية مع QR ورابط واتساب جاهز
- ربط قناة YouTube server-side (OAuth read-only)
- جلسة إدارية HMAC-signed مع CSRF وRate Limiting
- Honeypot و Duplicate-request guard في نموذج الطلبات

---

## 2. تقييم الفكرة والسوق

### نقاط القوة الفكرية ✅

**فجوة سوقية حقيقية**
لا توجد منصة عربية متخصصة جمعت بين كتالوج صوتي منظم + مشغل مستمر + قمع تحويل مباشر للواتساب في منتج واحد متكامل.

**سهولة التبني (Zero Friction)**
لا تسجيل — لا دفع مسبق — الزائر يستمع ويطلب في أقل من دقيقة. هذا يرفع معدل التحويل بشكل جوهري مقارنة بالمنافسين الذين يطلبون إنشاء حساب.

**الاستهداف الصحيح للسوق**
السوق الخليجي (السعودية، الإمارات، الكويت، البحرين) بإنفاق مرتفع على الأعراس والمناسبات، والطلب على المحتوى الصوتي المخصص في ارتفاع مستمر مع قلة العرض المنظم.

**نموذج عمل مرن وقابل للتوسع**
البدء بالواتساب يُخفف الاحتكاك تماماً مع إمكانية إضافة دفع إلكتروني مباشر لاحقاً دون إعادة بناء المنصة.

### نقاط الضعف الفكرية ⚠️

**Moat منخفض (Competitive Moat)**
الفكرة قابلة للنسخ بنفس التقنية. الميزة التنافسية الحقيقية ستكون في: جودة المحتوى الصوتي + سرعة الاستجابة + تنوع الكتالوج + العلامة التجارية. **الحل:** بناء كتالوج ضخم وتجربة صوتية فائقة الجودة لا يسهل تكرارها.

**الاعتماد الكلي على WhatsApp**
أي تغيير في سياسات WhatsApp Business قد يؤثر على قمع التحويل. **الحل:** إضافة قناة بديلة (Telegram Bot أو نموذج ويب مع بريد إلكتروني) كـ fallback.

**غياب Social Proof**
لا يوجد نظام تقييم أو شهادات موثّقة من زبائن سابقين، مما يُقلل الثقة للزوار الجدد. **الحل:** إضافة قسم "قالوا عنا" أو عدادات "تم الطلب X مرة".

---

## 3. الوضع الحالي للكود

### حالة البنية التقنية

> **تنبيه:** وثيقة `ARCHITECTURE.md` تصف **Next.js App Router** كـ frontend، لكن المشروع الفعلي يستخدم **TanStack Start + Vite + Nitro**. هذا تناقض يضلل كل مطور يقرأ الوثيقة ويجب تصحيحه فوراً.

| الطبقة | الوضع | التقييم |
|---|---|---|
| TypeScript | يمر بنجاح (بحسب تقارير البناء السابقة) | ✅ جيد |
| الاختبارات | 24 اختباراً في 5 ملفات (unit tests فقط) | ⚠️ محدود |
| ESLint | 1,078 مشكلة في 26 ملفاً (معظمها legacy / generated) | ❌ يمنع CI |
| البناء | يبني بنجاح — Vite + Nitro | ✅ جيد |
| Migrations | طُبقت على Supabase؛ تم التحقق من الجداول والقيود الجديدة | ✅ |

### أحجام الملفات الإشكالية

| الملف | الحجم | الحكم |
|---|---|---|
| `src/orchest/server/api.ts` | 94,538 بايت / ~2,327 سطر | ❌ ضخم جداً |
| `src/orchest/components/AdminDashboard.tsx` | 99,147 بايت / ~2,243 سطر | ❌ ضخم جداً |
| `src/orchest/App.tsx` | 48,485 بايت / ~1,189 سطر | ⚠️ كبير |
| `src/orchest/components/GiftDeliveryPanel.tsx` | 20,261 بايت | ✅ مقبول |
| `src/orchest/components/OrderModal.tsx` | 19,230 بايت | ✅ مقبول |

---

## 4. المشاكل والعيوب المكتشفة

### 🔴 مشاكل حرجة — P0 (تمنع النشر كلياً)

#### P0-1 — ✅ محلول: عنوان Sandbox في vite.config.ts

تم حذف `allowedHosts` الخاص ببيئة Manus في commit `3a4426d`. يجب إبقاء الإعداد الافتراضي وعدم إعادة عنوان Sandbox إلى الإنتاج.

---

#### P0-2 — ✅ محلول: Migrations وSchema الحي

تم تطبيق migrations المطلوبة والتحقق من وجود الجداول التالية في قاعدة البيانات الحية:
- `orchest_admin_users` → تسجيل دخول المدير لن يعمل
- `gift_deliveries` → بطاقات التسليم لن تعمل
- `push_subscriptions` → Web Push لن يعمل
- `admin_youtube_connections` → ربط YouTube لن يعمل
- `admin_ai_audit_logs` → مساعد AI لن يسجّل
- حقل `is_published` في جدول `tracks` → نشر/إخفاء الأعمال لن يعمل

**الملفات التي تحتاج تطبيقاً (بالترتيب):**
```
20261020031015_add_offers_and_theme_settings.sql
20261021021800_reconcile_seeded_catalog_metrics.sql
20261021022300_secure_public_submissions.sql
20261022100000_add_track_publication.sql
20261022102000_add_orchest_media_bucket.sql
20261023000000_orchest_admin_gift_delivery.sql
20261023194804_ad4c3203-....sql
20261023195122_b5674562-....sql
20261024000000_platform_integrations.sql
```
**النتيجة الحية:** جداول الإدارة والبطاقات والتكاملات موجودة، وظهرت migrations التطبيق في سجل Supabase. يبقى أخذ backup تشغيلي قبل أول استخدام إنتاجي مهم.

---

#### P0-3 — متغيرات البيئة الحيوية غير مضبوطة

```bash
PUBLIC_SITE_URL=           # مفقود → canonical + sitemap + og:url مكسورة
VITE_PUBLIC_SITE_URL=      # مفقود → OG tags مكسورة في client
ADMIN_SESSION_SECRET=      # يُستخدم مفتاح Supabase كبديل — خطر أمني
SUPABASE_SERVICE_ROLE_KEY= # مطلوب لجميع عمليات الإدارة
LOVABLE_API_KEY=           # مطلوب لمساعد AI
```

---

#### P0-4 — ✅ محلول: Web Push مع Vercel Node runtime

```json
"web-push": "^3.6.7"
```

تم تثبيت `nitro: { preset: "vercel" }` في `vite.config.ts` حتى يعمل `web-push` على Vercel Node.js. لا ينبغي نشر هذه النسخة على Cloudflare Workers دون استبدال مكتبة Web Push.

---

#### P0-5 — تناقض التوثيق في ARCHITECTURE.md

```
الوثيقة: "Frontend: Next.js App Router"
الواقع:  TanStack Start + TanStack Router + Nitro
```

**التأثير:** يُضلّل أي مطور يُشارك في المشروع ويؤدي لقرارات معمارية خاطئة.
**الحل:** تحديث `docs/ARCHITECTURE.md` بالبنية الفعلية الحالية.

---

### 🟠 مشاكل مهمة — P1 (يجب إصلاحها قريباً)

#### P1-1 — ملفان ضخمان يُعيقان الصيانة

| الملف | المشكلة | الحل |
|---|---|---|
| `AdminDashboard.tsx` (2,243 سطر) | صعب الصيانة، يبطئ HMR | تقسيمه: AdminTracksPanel + AdminSettingsPanel + AdminAnalyticsPanel + AdminOrdersPanel |
| `server/api.ts` (2,327 سطر) | cold start أطول، صعب اختباره | تقسيمه: api/auth.ts + api/catalog.ts + api/analytics.ts + api/admin.ts |

#### P1-2 — Rate Limiting In-Memory لا يعمل في Serverless

```typescript
// api.ts — السطر 44
const requestWindows = new Map<string, { count: number; resetAt: number }>();
```

في Serverless، كل instance يملك Map منفصلة → Rate limit غير فعال مع تعدد instances.
**الحل:** Upstash Redis (مجاني حتى 10,000 طلب/يوم) أو Vercel KV.

#### P1-3 — روابط المشاركة تؤدي لصفحات 404

```typescript
// TrackCard.tsx — السطر 31
const shareUrl = `${window.location.origin}/tracks/${track.code.replace('#', '')}`;
```

صفحات `/tracks/[code]` غير موجودة. أي رابط يُشارَك سيعطي 404.
**الحل (سريع):** تغيير الرابط ليشير للصفحة الرئيسية + query param: `/?track=ORC-204`
**الحل (المثالي):** بناء صفحات `/tracks/[code]` ثابتة (راجع القسم 9).

#### P1-4 — ✅ محلول: صفحات الخطأ أصبحت عربية

تم تعريب 404 وصفحة الخطأ وإضافة `dir="rtl"` في `src/routes/__root.tsx`.

#### P1-5 — Rate Limit Map تنمو بلا حد في الذاكرة

```typescript
const requestWindows = new Map<string, { count: number; resetAt: number }>();
// لا يوجد cleanup للمدخلات المنتهية الصلاحية
```

**الحل:** إضافة دالة cleanup دورية أو استخدام LRU Cache بحجم محدد.

---

### 🟡 مشاكل ثانوية — P2 (تحسينات جودة)

#### P2-1 — ESLint فاشل بـ 1,078 مشكلة

يمنع وضع `npm run lint` كـ CI gate.
**الحل المرحلي:** إضافة `.eslintignore` لملفات `generated` و`legacy`، ثم إصلاح الجديدة.

#### P2-2 — غياب E2E Tests للـ User Flows الحرجة

لا توجد اختبارات Playwright/Cypress لـ:
- تشغيل زفة → التحقق من بدء الصوت
- فتح نافذة الطلب وإكمالها → التحقق من رابط واتساب
- تسجيل دخول المدير → التحقق من صلاحية الوصول

#### P2-3 — ✅ محلول: og:image

تم إنشاء `public/og-image.jpg` بمقاس 1200×630 من شعار الاستوديو المرفق وربطه في metadata.

#### P2-4 — ✅ محلول: fallback لصور الأعمال

تم استخدام `/icon-512.png` كـfallback نهائي عند غياب صور الغلاف.

#### P2-5 — حقل audioFreq موثّق لكن غير مُطبَّق

```typescript
// types/index.ts
audioFreq?: number; // base frequency for synth audio
```

يوحي بـ synth engine غير موجود. **الحل:** حذفه أو توثيق متى سيُطبَّق.

---

## 5. تقييم الأمان

| المحور | التقييم | الملاحظة |
|---|---|---|
| جلسة المدير | ✅ ممتاز | HMAC-signed + HttpOnly Cookie + TTL ساعتين |
| CSRF Protection | ✅ جيد | رمز مشتق من الجلسة |
| Rate Limiting | ⚠️ محدود | In-Memory — غير فعال في Serverless متعدد |
| Honeypot في الطلبات | ✅ جيد | مُطبَّق في OrderModal |
| Service Role Key | ✅ ممتاز | خادمي فقط، لا يصل للمتصفح |
| Payload Size Check | ✅ جيد | حد 256KB في shim.ts |
| Leaked Password Protection | ❌ خطر | **معطَّلة في Supabase — يجب تفعيلها** |
| مفاتيح AI | ✅ ممتاز | خادمية فقط، لا VITE_ prefix |
| YouTube OAuth Tokens | ✅ ممتاز | مُشفَّرة AES-256-GCM قبل التخزين |
| SQL Injection | ✅ جيد | Supabase JS Client يمنعه بالبنية |
| XSS | ✅ جيد | React يمنعه تلقائياً عبر JSX |

**إجراء عاجل:** تفعيل **Leaked Password Protection** من Supabase Dashboard ← Auth ← Security.

---

## 6. تقييم SEO والأداء

### حالة SEO

| العنصر | الوضع | الحكم |
|---|---|---|
| Title + Description | موجودان في root وindex routes | ✅ |
| Open Graph (og:title, og:description) | موجود | ✅ |
| og:image | **غائب** | ❌ |
| JSON-LD (Organization schema) | موجود في loading state | ✅ |
| Canonical URL | مشروط بـ PUBLIC_SITE_URL | ✅ |
| robots.txt | يحجب /api/ و/gift/ والإدارة | ✅ |
| Sitemap XML | يُنشأ في postbuild بعد ضبط النطاق | ✅ |
| lang="ar" dir="rtl" على html | ✅ | ✅ |
| صفحات مستقلة للأعمال (/tracks/slug) | **غائبة** | ❌ ثغرة كبيرة |
| صفحات التصنيفات (/category/slug) | **غائبة** | ❌ ثغرة |
| HTML للـ Bots قبل JS | موجود وعربي حقيقي | ✅ ممتاز |

### تحليل الأداء

**نقاط قوة:**
- Lazy loading للـ AdminDashboard (لا يُحمَّل إلا عند الطلب)
- صور بـ `loading="lazy"`
- Google Fonts مع `preconnect`
- Service Worker يُخزّن الأصول الثابتة

**نقاط ضعف محتملة:**
- `App.tsx` يستورد جميع مكونات الـ orchest بشكل مباشر → bundle ضخم للـ homepage
- `api.ts` الضخم يزيد cold start time في Serverless
- لا يوجد Image Optimization تلقائي (عكس `next/image`)

---

## 7. جاهزية Vercel

### ما يعمل تلقائياً ✅

| الميزة | الوضع |
|---|---|
| TanStack Start SSR | يعمل على Node.js Runtime |
| Environment Variables | يُضبط من Vercel Dashboard |
| Automatic HTTPS | مُدار من Vercel |
| Static Assets CDN | الأصول تُخدم من Edge |
| Preview Deployments | كل Push يحصل على Preview URL |
| Custom Domains | مدعوم كاملاً |

### ما يحتاج إعداداً يدوياً ⚙️

**1. Build Configuration (vercel.json)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "installCommand": "npm install",
  "functions": {
    "src/server.ts": {
      "runtime": "nodejs22.x"
    }
  }
}
```

**2. متغيرات البيئة المطلوبة في Vercel Dashboard**
```bash
# ضرورية
VITE_SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://ktkzinhogzhaecspkzlc.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SESSION_SECRET=<random-32-chars>
PUBLIC_SITE_URL=https://orchest.studio
VITE_PUBLIC_SITE_URL=https://orchest.studio

# اختيارية (تُفعّل الميزات المتقدمة)
LOVABLE_API_KEY=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=https://orchest.studio/api/admin/youtube/callback
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@orchest.studio
```

**3. التحقق من Nitro Preset**

تم تثبيت Nitro صراحة على `vercel` preset في `vite.config.ts`، وتم التحقق من أن build الإنتاج ينجح على هذه الإعدادات.

### نقاط صراع محتملة مع Vercel

| المشكلة | التأثير | الحل |
|---|---|---|
| `allowedHosts` sandbox في vite.config | 403 على كل Vercel domains | حذف السطر |
| `web-push` على Edge Runtime | Crash في runtime | ✅ تم فرض Vercel Node.js في vite.config.ts |
| In-memory rate limit | غير فعال مع multiple instances | Upstash Redis |
| Nitro preset = cloudflare | build output خاطئ | ✅ مغلق: `nitro: { preset: "vercel" }` |

---

## 8. Critical Blockers قبل النشر

بالترتيب الإلزامي:

### Blocker 🔴 1 — ✅ مغلق: حذف allowedHosts من vite.config.ts

```typescript
// احذف هذا السطر:
allowedHosts: ["8080-i1xjrflr13ln7zk7vxgh6-721a5837.us4.manus.computer"],
```

زمن التنفيذ: **5 دقائق**

---

### Blocker 🔴 2 — ✅ مغلق: تطبيق Migrations على Supabase

تم تطبيق migrations المطلوبة والتحقق من الجداول والقيود عبر Supabase. يبقى فقط توثيق backup تشغيلي قبل استقبال بيانات العملاء.

زمن التنفيذ: **30-60 دقيقة**

---

### Blocker 🔴 3 — ضبط متغيرات البيئة وربط المستودع الصحيح في Vercel

```bash
# Vercel Dashboard → Project → Settings → Environment Variables
# أضف جميع المتغيرات المذكورة في القسم 7
```

زمن التنفيذ: **15 دقيقة**

---

### Blocker 🔴 4 — تفعيل Leaked Password Protection

```
Supabase Dashboard → Authentication → Providers → Email → 
Enable "Leaked Password Protection"
```

زمن التنفيذ: **2 دقيقة**

---

### Blocker 🔴 5 — ✅ مغلق: إنشاء حساب Admin في Supabase

تم التحقق من وجود حساب إداري في Auth ووجود صف واحد في `public.orchest_admin_users`. لا تضف حساباً آخر إلا بموافقة صاحب الاستوديو.

زمن التنفيذ: **10 دقائق** (بعد إنشاء حساب Auth)

---

### Blocker 🟠 6 — ✅ مغلق: ترجمة صفحات الخطأ للعربية

```typescript
// src/routes/__root.tsx — تعديل NotFoundComponent وErrorComponent
```

زمن التنفيذ: **20 دقيقة**

---

### Blocker 🟠 7 — ✅ مغلق: إضافة og:image

```typescript
// src/routes/__root.tsx — إضافة في head():
{ property: "og:image", content: `${publicSiteUrl}/og-image.jpg` },
{ property: "og:image:width", content: "1200" },
{ property: "og:image:height", content: "630" },
```

زمن التنفيذ: **30 دقيقة** (تصميم الصورة + إضافة الكود)

---

## 9. تحسينات مقترحة للتميز

### 🚀 تأثير مباشر على الإيرادات

#### أ. صفحات SSG لكل زفة (`/tracks/[code]`)

```
الفائدة: Google يفهرس "زفة الملاك — ORC-204" كصفحة مستقلة
         → traffic عضوي مجاني مستهدف من البحث
التطبيق: TanStack Router File Route + Supabase SSG data fetch
الأولوية: عالية جداً
```

#### ب. نظام التقييمات والإثبات الاجتماعي

```
إضافة: "اختارها 47 زبوناً" أو تقييم نجوم من مشترين سابقين
الفائدة: يرفع معدل التحويل 15-30% للزوار الجدد
```

#### ج. قناة بديلة لـ WhatsApp (Telegram Bot)

```
إضافة زر "اطلب عبر تيليجرام" كخيار ثانٍ
الفائدة: fallback عند انقطاع WhatsApp + خدمة شريحة مختلفة
```

#### د. برنامج الإحالة البسيط

```
"أرسل الرابط لصديقك، احصل على خصم 10% لكليكم"
الفائدة: viral loop بدون تكلفة تسويق
```

---

### 🎯 تحسين التجربة

#### أ. صفحات التصنيفات المستقلة

```
/category/zaffat-bride   → "زفات العروس — 24 عمل"
/category/sheilat        → "الشيلات الترحيبية — 18 عمل"
الفائدة: SEO + تجربة تصفح أوضح
```

#### ب. Waveform Preview في بطاقة الزفة

```
عرض موجة صوتية مرئية مصغرة في الكارد حتى قبل الضغط على تشغيل
الفائدة: تمييز بصري لأنواع الأعمال الصوتية
```

#### ج. مقارنة بين عملين

```
السماح بـ "تشغيل 30 ثانية من هذا + 30 ثانية من ذاك" للمقارنة
الفائدة: يساعد الزبون على الحسم السريع
```

#### د. أرشيف طلبات للزبون بدون تسجيل

```
حفظ رقم الطلب في localStorage مع رابط /order-status?token=xxx
الفائدة: يُقلل استفسارات "وين طلبي؟" على واتساب
```

#### ه. Chat Widget مُحسَّن

```
بدلاً من النقل الفوري لـ WhatsApp:
→ نافذة صغيرة تعرض رقم واتساب + وقت الرد المتوقع + رسالة جاهزة للنسخ
```

---

### 💎 تميز على المدى البعيد

#### أ. AI اقتراح الزفة المناسبة

```
"أخبرنا عن مناسبتك" → AI يقترح 3 زفات مناسبة مع شرح السبب
التقنية: Gemini Flash + semantic search على الكتالوج
```

#### ب. حزم التخصيص (Bundles)

```
"زفة عروس + شيلة ترحيب + زفة رجال" كحزمة واحدة بسعر مميز
الفائدة: رفع متوسط قيمة الطلب (Average Order Value)
```

#### ج. Preview Voice Sample مخصص

```
نموذج يُدرج اسم الزبون في مقطع تجريبي قصير (TTS API)
الفائدة: تجربة "wow" فريدة لا تُنسى
```

#### د. Google Analytics 4 مع تتبع التحويل

```
تتبع: play_event → modal_open → whatsapp_click
الفائدة: معرفة أي الأعمال تُحوّل أكثر وتحسين الكتالوج بناءً على البيانات
```

---

## 10. خارطة طريق التنفيذ

### المرحلة الأولى — الإطلاق الآمن (5-7 أيام)

```
اليوم 1-2: تقني
  □ حذف allowedHosts من vite.config.ts
  ☑ تطبيق migrations على Supabase والتحقق من الجداول والقيود
  □ التحقق من الجداول بعد كل migration
  □ إنشاء حساب Admin وإضافته لـ orchest_admin_users

اليوم 2-3: بيئة
  □ تفعيل Leaked Password Protection في Supabase
  □ ضبط متغيرات البيئة في Vercel Dashboard
  □ إنشاء vercel.json بالإعدادات الصحيحة
  ☑ تأكيد Nitro preset = vercel

اليوم 3-4: محتوى وجودة
  ☑ ترجمة صفحات الخطأ للعربية
  ☑ تصميم وإضافة og:image (1200×630px) من شعار العميل
  ☑ إضافة cover fallback للأعمال بدون صورة

اليوم 5-6: اختبار
  □ نشر على Vercel Preview
  □ اختبار تسجيل الدخول وصلاحيات الإدارة
  □ اختبار تشغيل الصوت على Android + iOS
  □ اختبار نافذة الطلب ورابط واتساب
  □ اختبار بطاقة التسليم والـ QR

اليوم 7: الإطلاق
  □ نشر على Production
  □ ضبط النطاق الحقيقي
  □ إرسال Sitemap لـ Google Search Console
  □ اختبار نهائي شامل
```

### المرحلة الثانية — تحسين الجودة (أسبوعان)

```
□ تقسيم AdminDashboard.tsx إلى 4 مكونات
□ تقسيم server/api.ts إلى ملفات منفصلة
□ إصلاح ESLint baseline
□ استبدال In-Memory rate limit بـ Upstash Redis
□ إضافة صفحات تصنيفات مستقلة
□ كتابة 3 E2E tests للـ happy paths
□ إضافة Google Analytics 4
```

### المرحلة الثالثة — النمو (شهر)

```
□ صفحات SSG لكل زفة (/tracks/[code])
□ نظام التقييمات والإثبات الاجتماعي
□ قناة Telegram كبديل/إضافة لـ WhatsApp
□ og:image ديناميكي لكل زفة
□ برنامج الإحالة البسيط
□ AI اقتراح الزفة المناسبة
```

---

## 11. التقييم الإجمالي

### مؤشرات الجاهزية

| المحور | الدرجة | الملاحظة |
|---|---|---|
| **جودة الكود** | 73/100 | متقن في الأساس، يحتاج refactoring للملفات الضخمة |
| **الأمان** | 78/100 | قوي في الجوهر، Leaked Password Protection يجب تفعيلها |
| **SEO** | 60/100 | أساس جيد، ينقصه صفحات مستقلة للأعمال والتصنيفات |
| **تجربة المستخدم** | 88/100 | ممتازة — RTL، صوت مستمر، واتساب في 3 خطوات |
| **الفكرة والسوق** | 85/100 | قوية ومُتمايزة في نيشها الخليجي |
| **جاهزية Vercel** | 55/100 | تحتاج 5 blockers قبل نشر فعلي |
| **قابلية التوسع** | 70/100 | بنية جيدة، تحتاج تقسيم الملفات الضخمة |

### الحكم النهائي

> **🟡 Release Candidate — الكود وSupabase متحققان، ويتوقف الإطلاق على إعداد Vercel والأسرار والنطاق**
>
> المشروع من أفضل ما بُني لهذا النيش في المنطقة العربية تقنياً.
> الكود متين، الفكرة صحيحة، والتنفيذ محترف ومراعٍ للتفاصيل.
>
> **لكن لا يُطلَق على العملاء** قبل إغلاق الـ Blockers المذكورة.
> الوقت المتوقع للإطلاق الآمن: **5-7 أيام عمل** بعد توفير الأسرار وتطبيق الـ Migrations.

---

*تقرير مُعَدّ بتاريخ 24 أكتوبر 2026 | Orchest Studio Analytical Review v1.0*
