# تقرير جاهزية Orchest Studio — PWA وSEO والتكاملات

**تاريخ التقرير:** 2026-10-23

## الخلاصة التنفيذية

تم تحويل النسخة الحالية من موقع كتالوج إلى أساس منصة تشغيل للاستوديو. أضيفت طبقة PWA قابلة للتثبيت، Service Worker يحمي البيانات الخاصة ولا يخزن API، صفحة أوفلاين عربية، إعدادات Web Push للمدير، SEO أولي قابل للزحف، sitemap/robots يتولدان وقت البناء بعد ضبط النطاق، مساعد إداري grounded، وربط YouTube server-side بصلاحية قراءة فقط واستيراد غير منشور للمراجعة.

الكود يمر من TypeScript والاختبارات والبناء وESLint للملفات المعدلة. لكنه **ليس جاهزاً للإطلاق الإنتاجي النهائي بعد**؛ لأن migrations الجديدة لم تطبق على Supabase، والنطاق والأسرار الخارجية لم تضبط، والاختبار الحقيقي على هاتف/نطاق HTTPS لم ينفذ من هذه البيئة، وlint الشامل يحمل baseline قديم داخل ملفات لم تعدلها هذه الجولة.

## ما تم تنفيذه

### PWA وتجربة التطبيق

- أضيف `/site.webmanifest` باسم عربي، RTL، أيقونات 192 و512، `standalone`، اختصارات الكتالوج والإدارة، وألوان الهوية.
- أضيف `/sw.js` مع cache للأصول الثابتة وصفحة `/offline.html` فقط. يستثني `/api/` والجلسات والبيانات الخاصة من التخزين.
- أضيف تسجيل Service Worker بعد hydration، ورسالة تثبيت عند توفر `beforeinstallprompt`، ورسالة تحديث لا تجبر المستخدم على تبديل النسخة دون موافقته.
- أضيف استقبال push داخل Service Worker وفتح لوحة الإدارة عند النقر على الإشعار.
- لوحة الإعدادات تسمح للمدير بتفعيل الإشعارات وإيقافها وإرسال اختبار، ولا تعرض نجاحاً قبل حفظ اشتراك المتصفح فعلياً.
- عند وصول طلب جديد محفوظ، يحاول الخادم إرسال إشعار للمديرين المشتركين، وينظف الاشتراكات التي ترجع 404/410.

### SEO وGoogle

- لم تعد الصفحة الأولية مجرد spinner؛ HTML الخام يحمل عنواناً عربياً، H1، وصف الخدمات، روابط قابلة للزحف، وJSON-LD لمنظمة أوركست.
- أضيفت metadata للعنوان والوصف وOpen Graph وTwitter وtheme color وmanifest وApple Touch Icon.
- canonical و`og:url` وJSON-LD URL لا تظهر إلا بعد ضبط `VITE_PUBLIC_SITE_URL`، حتى لا ينتشر نطاق sandbox أو رابط تخميني.
- `robots.txt` يمنع `/api/` و`/gift/` والمسارات الخاصة. postbuild ينشئ `sitemap.xml` وrobots مع Sitemap مطلق عندما يكون `PUBLIC_SITE_URL` مضبوطاً.
- لم أضع وعداً بالمركز الأول في Google؛ لا أحد يستطيع ضمان ذلك. القياس الصحيح سيكون عبر Search Console وCTR وCore Web Vitals والطلبات المؤهلة.

### مساعد الإدارة الموثوق

- أضيف `/api/admin/assistant` مع جلسة المدير وCSRF وrate limit.
- الخادم يقرأ نطاقاً محدوداً من الأعمال والطلبات والتصنيفات من Supabase، ولا يثق في كتالوج يرسله المتصفح.
- إجابة النموذج منظمة في `answer` و`evidenceRefs` و`confidence` و`needsReview`، وتُرشح المراجع ضد صفوف موجودة فعلاً.
- لا ينفذ SQL يكتبه النموذج ولا عمليات كتابة، ويعامل نصوص الطلبات والوصف كبيانات غير موثوقة.
- عند غياب مزود AI أو فشل الاستجابة، يوجد fallback حتمي يقول إن البيانات غير كافية بدلاً من الاختلاق.
- يسجل audit hash للسؤال ومراجع الأدلة وحالة المراجعة دون حفظ نص السؤال أو كلمات المرور.

### YouTube

- أضيفت لوحة ربط القناة ومزامنتها.
- OAuth server-side بصلاحية `youtube.readonly` فقط، مع state موقّع ومؤقت.
- refresh/access tokens تشفر AES-256-GCM خادمياً قبل التخزين، ولا تصل إلى المتصفح.
- تتم قراءة القناة وقائمة uploads والعنوان والوصف والصورة والمدة والرابط، مع حفظ `source_provider` و`source_video_id` و`source_url`.
- الأعمال تدخل `is_published=false` وتحتاج مراجعة الإدارة، ويمنع المعرف الثابت تكرار العناصر.
- لم يتم ادعاء استيراد transcript أو captions؛ ذلك تكامل وصلاحيات وسياسة منفصلة.

## ملفات مهمة أضيفت أو عدلت

| المجال | الملفات |
|---|---|
| PWA | `public/site.webmanifest`, `public/sw.js`, `public/offline.html`, `public/icon-192.png`, `public/icon-512.png`, `src/pwa/PwaRuntime.tsx`, `src/orchest/App.tsx` |
| SEO | `src/routes/index.tsx`, `src/routes/__root.tsx`, `public/robots.txt`, `scripts/generate-seo-assets.mjs` |
| الإدارة | `src/orchest/components/AdminAssistantPanel.tsx`, `src/orchest/components/YouTubeImportPanel.tsx`, `src/orchest/components/PwaNotificationsPanel.tsx` |
| API | `src/orchest/server/api.ts`, `src/orchest/server/shim.ts` |
| التكاملات | `src/orchest/services/adminAssistant.ts`, `youtubeIntegration.ts`, `adminPush.ts` |
| البيانات | `supabase/migrations/20261024000000_platform_integrations.sql`, `src/integrations/supabase/types.ts` |
| الإعداد | `.env.example`, `plan.md`, `TODO.md`, `package.json`, `package-lock.json` |

## نتائج التحقق

| الفحص | النتيجة | التفاصيل |
|---|---:|---|
| `npx tsc --noEmit` | ناجح | لا أخطاء TypeScript بعد آخر تعديل |
| `npm test` | ناجح | 5 ملفات اختبار، 24 اختباراً |
| `npm run build` | ناجح | Vite/Nitro وCloudflare preset يبنون بنجاح |
| ESLint للملفات المعدلة | ناجح | لا أخطاء في ملفات الجولة |
| `git diff --check` | ناجح | لا مسافات أو نهايات تالفة |
| HTTP smoke | ناجح | HTML، JSON-LD، manifest، SW، robots، ورفض API دون جلسة |
| lint الشامل | يحتاج عمل مستقل | 1078 مشكلة: 1072 خطأ و6 تحذيرات في 26 ملفاً، بينها generated Supabase types القديمة؛ فحص التطبيق المعدل باستثناء generated types ناجح |
| fake-data scan | سليم في runtime | لا توجد سجلات `INITIAL_*` أو `mockData` في مسار التشغيل؛ ظهرت `example.com` في اختبارات وplaceholder فقط |

## الأخطاء والمخاطر المتبقية

### مانع إطلاق — migrations Supabase

الملف `20261024000000_platform_integrations.sql` لا يطبق تلقائياً. ينشئ حقول مصدر الأعمال وجداول `admin_youtube_connections` و`push_subscriptions` و`admin_ai_audit_logs`. إذا لم يطبق، ستعرض الواجهات حالة إعداد واضحة، لكن YouTube وPush وaudit لن تعمل. يجب تطبيقه بعد مراجعة المشروع المشترك، إضافة فهارس مناسبة، وأخذ backup/خطة rollback.

### مانع إطلاق — الأسرار والنطاق

يجب ضبط `PUBLIC_SITE_URL` أو `VITE_PUBLIC_SITE_URL` على نطاق HTTPS حقيقي. يلزم أيضاً `ADMIN_SESSION_SECRET`، و`SUPABASE_SERVICE_ROLE_KEY` خادمياً، و`LOVABLE_API_KEY` إن أريد رد AI، و`YOUTUBE_CLIENT_ID/SECRET` مع Redirect URI مطابق، و`VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT` للإشعارات. لا توجد قيم حقيقية داخل المستودع، وهذا مقصود.

### مانع إطلاق — هدف Web Push

الموقع الحالي يبني Cloudflare/Nitro بنجاح، لكن حزمة `web-push` تعتمد على Node في الإرسال. يوصى باختيار Vercel/Node للإرسال أو تنفيذ مرسل Web Push متوافق مع Workers قبل إعلان Cloudflare هدف الإنتاج. لا يكفي نجاح build لإثبات توصيل push في بيئة حقيقية.

### جودة lint

الـ lint الكامل لا يزال يفشل بسبب baseline قديم في مكونات UI وملفات Orchest القديمة وبسبب أن `src/integrations/supabase/types.ts` ملف generated غير منسق وفق قواعد المشروع. القياس الحالي 1078 مشكلة في 26 ملفاً. هذه ليست أخطاء منطقية أضافتها الجولة؛ فحص التطبيق المعدل باستثناء generated types مرّ، لكن هذا يمنع وضع `npm run lint` كحارس CI حتى يتم تنظيف الملفات أو فصل قواعد generated/legacy مؤقتاً.

### اختبار الأجهزة الحقيقية

لم ينفذ من Sandbox اختبار تثبيت فعلي على Chrome Android أو Safari iOS، ولا اختبار إذن الإشعارات بعد إغلاق التطبيق أو النقر على الإشعار. يلزم اختبار Preview HTTPS حقيقي على جهازين على الأقل؛ الإذن اختياري والتوصيل Best Effort ولا يجوز اعتباره مضموناً 100%.

### SEO

وجود metadata لا يضمن الفهرسة أو المركز الأول. يجب بعد نشر النطاق إضافة الموقع في Search Console، إرسال Sitemap، فحص canonical وstructured data، رصد Core Web Vitals، بناء صفحات عامة مستقلة للتصنيفات والأعمال المنشورة، واستبعاد صفحات الإدارة والهدايا.

## الترتيب المقترح قبل الإطلاق

1. اختيار Manus/Cloudflare أو Vercel/Node، والأفضل Vercel إذا كان Web Push server-side سيبقى عبر `web-push`.
2. ضبط الأسرار والنطاق في بيئة Preview أولاً، ثم تطبيق migration بعد مراجعة SQL وbackup.
3. إنشاء/تأكيد عضوية المدير في `orchest_admin_users` وعدم منح الصلاحية لأي UUID غير مقصود.
4. تسجيل Google OAuth Redirect URI واختبار ربط قناة، ثم استيراد عدد صغير ومراجعة الأعمال قبل النشر.
5. توليد VAPID، تفعيل إشعارات المدير، اختبار الإشعار اليدوي ثم اختبار إشعار طلب حقيقي.
6. نشر Preview، تنفيذ smoke وE2E على الهاتف، ثم Production. بعد ضبط النطاق سيولد postbuild sitemap مطلقاً تلقائياً.
7. تنظيف lint baseline في تغيير مستقل حتى يصبح CI أخضر بالكامل.

## قرار الإصدار

الحالة الحالية **Release Candidate برمجياً وليست Production Ready**. الكود والواجهات الأساسية متماسكة ومتحققة محلياً، لكن التشغيل الإنتاجي يتوقف على قرارات وأسرار وموافقة تطبيق migrations واختبار HTTPS حقيقي. لذلك لا ينبغي إعلان المنصة جاهزة نهائياً أو نشرها على نطاق العملاء قبل إغلاق الموانع المذكورة أعلاه.
