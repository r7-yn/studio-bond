# Design System: أوركست (Orchest Studio)

<!--
All visual tokens and interface decisions for Orchest Studio live here.
Tokens adapt dynamically via data-theme attribute on <html>:
[data-theme="dark"] (Default luxury theme) and [data-theme="light"].
-->

## 01 Brand identity

- Personality: فخم (luxurious), ملكي (regal), انسيابي (seamless)
- Tone in UI copy: خليجي راقٍ، مهذب، صريح، مختصر، ومباشر نحو الطلب
- Feel: صوتي غامر، مساحات واسعة مريحة، طابع ملكي غير مزدحم، تركيز تام على العمل الصوتي وزر الواتساب
- Reference sites we like: Anghami (مشغل الصوت المستمر والوايف فورم), Apple Music (بساطة البطاقات والطباعة), Spotify Web Player (شريط التشغيل العائم)

## 02 Color palette

Use tokens in components. Never raw hex values. Tokens switch automatically between Dark (default) and Light mode.

| Token | Dark (Default) | Light | Use |
| --- | --- | --- | --- |
| --color-bg | #0B0B0E | #F9F9FB | Page background |
| --color-surface | #16161C | #FFFFFF | Cards, panels, inputs, dropdowns |
| --color-surface-hover | #1F1F27 | #F3F4F6 | Hover on cards and list rows |
| --color-border | #262630 | #E5E7EB | Dividers, card strokes, input borders |
| --color-text | #F3F4F6 | #111827 | Primary headers and body text |
| --color-text-muted | #9CA3AF | #6B7280 | Captions, metadata (duration, category) |
| --color-primary | #D4AF37 | #B89728 | Accent gold, active tabs, play highlights |
| --color-primary-hover | #C39F2E | #9E811F | Hover state on gold elements |
| --color-whatsapp | #25D366 | #25D366 | WhatsApp CTA buttons, conversions |
| --color-whatsapp-hover | #20BA5A | #20BA5A | Hover on WhatsApp CTA |
| --color-waveform | #D4AF37 | #B89728 | Active played progress on audio waveforms |
| --color-waveform-bg | #33333F | #E5E7EB | Unplayed audio track waveform background |
| --color-danger | #EF4444 | #DC2626 | Errors, delete track action |

Rules:
- Default theme is Dark (`#0B0B0E`). Light theme activates on `html[data-theme="light"]`.
- The primary CTA for ordering is always `--color-whatsapp` or `--color-primary`.
- Text on any background must pass WCAG AA (contrast ratio 4.5:1 minimum).
- Never hardcode raw hex values in CSS/Tailwind classes; use semantic tokens.

## 03 Typography

Arabic first (`dir="rtl"`). Supported font family stack: Alexandria, Cairo, system-ui, sans-serif.

| Role | Font | Size | Weight | Line height |
| --- | --- | --- | --- | --- |
| Display | Alexandria | 40px (Desktop: 48px) | 700 (Bold) | 1.2 |
| H1 | Alexandria | 30px (Desktop: 36px) | 700 (Bold) | 1.25 |
| H2 | Alexandria | 24px (Desktop: 28px) | 600 (SemiBold) | 1.3 |
| H3 | Alexandria | 18px (Desktop: 20px) | 600 (SemiBold) | 1.35 |
| Body | Cairo | 15px (Desktop: 16px) | 400 (Regular) | 1.6 |
| Small | Cairo | 13px (Desktop: 14px) | 400 (Regular) | 1.5 |
| Label | Cairo | 12px | 500 (Medium) | 1.4 |
| Meta/Code | Cairo / Monospace | 12px | 500 (Medium) | 1.4 |

Rules:
- Arabic headings keep natural letter spacing (0em tracking).
- Body text line length stays under 75 characters for comfortable reading.
- No more than two font families across the platform (Alexandria for titles, Cairo for body and UI elements).

## 04 Spacing

Base unit: 4px. Only use values from this scale.

| Token | Value | Typical use |
| --- | --- | --- |
| space-1 | 4px | Icon gaps, waveform bar margins |
| space-2 | 8px | Padding inside badges, pill filters |
| space-3 | 12px | Input inner padding, small buttons |
| space-4 | 16px | Mobile screen padding, default card gaps |
| space-6 | 24px | Card inner padding, section grid gaps |
| space-8 | 32px | Spacing between page sections (mobile) |
| space-12 | 48px | Spacing between page sections (desktop) |
| space-20 | 80px | Bottom safe area padding for Sticky Audio Player |

Layout:
- Max container width: 1240px, centered with 16px side padding on mobile, 24px on desktop.
- Grid: 12 columns on desktop, 6 columns on tablet, 2 columns on mobile.

## 05 Border radius and shadows

| Token | Value | Use |
| --- | --- | --- |
| radius-sm | 6px | Audio tags, duration badges, input fields |
| radius-md | 10px | Action buttons, bottom sheet inputs |
| radius-lg | 16px | Track cards, modals, player surface |
| radius-full | 9999px | Category pills, play/pause circular buttons |

Shadows:
- Elevated elements (Sticky Player, Modals, Dropdowns): `0 8px 32px rgba(0, 0, 0, 0.35)` in dark mode, `0 4px 20px rgba(0, 0, 0, 0.08)` in light mode.
- Cards rely on `1px solid var(--color-border)` without heavy blur shadows.

## 06 Components

Buttons

| Variant | Background | Text | Border | Use |
| --- | --- | --- | --- | --- |
| WhatsApp Primary | var(--color-whatsapp) | #FFFFFF | none | "اطلب عبر واتساب" (Main conversion CTA) |
| Primary Gold | var(--color-primary) | #0B0B0E | none | "استعرض الأعمال", featured actions |
| Secondary Surface | var(--color-surface) | var(--color-text) | 1px solid var(--color-border) | Category pills, filter actions |
| Ghost | transparent | var(--color-text) | none | Share, favorite, icon-only buttons |
| Danger | var(--color-danger) | #FFFFFF | none | Deleting tracks from Admin Dashboard |

- Height: 44px on mobile (touch-friendly), 40px on desktop. Padding: 0 18px, radius-md, Cairo Medium 500.
- Loading: Circular loader icon replaces text; width and height remain fixed.

Inputs & Selects
- Height: 44px, radius-md, background `var(--color-surface)`, border `1px solid var(--color-border)`.
- Focus state: `2px solid var(--color-primary)`, background stays clear.
- Labels: Always above the field, 12px, Cairo Medium.

Audio Track Card (بطاقة العمل)
- Background: `var(--color-surface)`, radius-lg, border `1px solid var(--color-border)`.
- Image aspect ratio: 16:10 or 1:1 with subtle dark vignette gradient.
- Elements: Floating duration badge, category chip, play button overlay, title, vocalist, and WhatsApp direct order button.

Sticky Bottom Audio Player (المشغل المستمر العائم)
- Height: 72px (mobile) to 80px (desktop), fixed at bottom (`z-index: 50`).
- Background: `var(--color-surface)` with `backdrop-filter: blur(12px)`.
- Border top: `1px solid var(--color-border)`.
- Controls: Track thumbnail, title/vocalist, live interactive WaveSurfer canvas, play/pause, volume slider (desktop), and quick order trigger.

WhatsApp Order Modal / Bottom Sheet
- Mobile: Pops up from bottom (`radius-lg` on top corners, max-height `85vh`).
- Desktop: Centered modal, max-width 480px.
- Fields: أسماء العروسين (Customer names), نوع التعديل (Customization type select), تاريخ المناسبة (Date picker).
- Action: Green WhatsApp CTA generating formatted dynamic `wa.me` URL.

## 07 Icons

- Icon Family: Lucide Icons (`lucide-react`).
- Standard sizes: 16px (inline labels), 20px (buttons and navigation), 24px (play controls and sheet headers).
- Stroke width: 1.75.
- Always include an Arabic `aria-label` when rendering icon-only buttons.

## 08 Responsive breakpoints

| Name | Min width | Behavior |
| --- | --- | --- |
| sm | 640px | Phones landscape, 2-column track grid |
| md | 768px | Tablets, bottom sheet switches toward modal |
| lg | 1024px | Desktop navigation header visible, dashboard sidebar locked open |
| xl | 1280px | Max container width constraint (1240px) applies |

Mobile Rules:
- Mobile-first approach: Designed primarily for 375px–430px viewports.
- Minimum touch target: 44px x 44px for all clickable controls.
- Thumb zone layout: Sticky audio controls and primary order buttons positioned within the lower 35% of the screen.

## 09 Motion & Transitions

- Durations: 150ms (micro-interactions, button hover), 250ms (bottom sheet slide-in, modal fade), 350ms (theme change transition).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for spring-like smooth entry, `ease-in` for closing.
- Reduced Motion: Honors `prefers-reduced-motion: reduce` by disabling non-essential slide animations and heavy waveform visualizers.
