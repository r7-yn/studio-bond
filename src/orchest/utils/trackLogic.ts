import type { OrderRequest, Track } from '../types/index';

const MAX_TEXT_LENGTH = 500;

/** Format a non-negative duration in seconds as MM:SS. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Parse a user-entered MM:SS duration into seconds, or return null when invalid. */
export function parseDuration(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
}

/** Format a number using a compact English suffix for dashboard display. */
export function formatNumberK(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (num >= 1000) {
    const k = (num / 1000).toFixed(1);
    return `${k.endsWith('.0') ? Math.floor(num / 1000) : k}K`;
  }
  return num.toString();
}

/** Format an integer with thousands separators. */
export function formatCommas(num: number): string {
  return num.toLocaleString('en-US');
}

/** Calculate a conversion rate percentage without dividing by zero. */
export function calculateConversionRate(leads: number, visits: number): number {
  if (!Number.isFinite(leads) || !Number.isFinite(visits) || visits <= 0) return 0;
  return Number(((leads / visits) * 100).toFixed(2));
}

export interface WhatsAppOrderInput {
  clientNames: string;
  modificationType: string;
  occasionDate: string;
  notes?: string;
  customPhone?: string;
}

/** Generate the formatted WhatsApp message for a studio order. */
export function generateWhatsAppMessage(track: Track, form: WhatsAppOrderInput): string {
  const clean = (value: string, fallback = 'غير محدد') => {
    const normalized = value.trim().slice(0, MAX_TEXT_LENGTH);
    return normalized || fallback;
  };
  const notes = form.notes?.trim().slice(0, MAX_TEXT_LENGTH);
  const notesStr = notes ? `\nملاحظات إضافية: ${notes}` : '';

  return `مرحباً، أود طلب عمل صوتي من استوديو أوركست:
• العمل: ${clean(track.title)}
• الكود: ${clean(track.code)}
• المنشد: ${clean(track.artist)}
• نوع الإيقاع: ${clean(track.rhythm)}
• أسماء العروسين / صاحب المناسبة: ${clean(form.clientNames)}
• نوع التعديل المطلوب: ${clean(form.modificationType)}
• تاريخ المناسبة: ${clean(form.occasionDate)}${notesStr}
• رابط العمل: https://orchest.com/tracks/${encodeURIComponent(track.code.replace('#', ''))}

يرجى إفادتي بتفاصيل التنفيذ والسعر. شكراً لكم.`;
}

/** Generate a WhatsApp click-to-chat URL from an international phone number. */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const sanitizedPhone = phone.replace(/[^0-9]/g, '');
  if (sanitizedPhone.length < 8 || sanitizedPhone.length > 15) return '';
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

/** Filter tracks by query, category, and rhythm. */
export function filterTracks(
  tracks: Track[],
  query = '',
  categoryId = 'all',
  rhythmFilter = 'all',
): Track[] {
  const cleanQuery = query.trim().toLocaleLowerCase();

  return tracks.filter((track) => {
    if (categoryId !== 'all' && track.categoryId !== categoryId) return false;
    if (rhythmFilter !== 'all' && track.rhythm !== rhythmFilter) return false;
    if (!cleanQuery) return true;

    return [track.title, track.artist, track.code, track.categoryLabel, track.lyrics ?? '']
      .some((value) => value.toLocaleLowerCase().includes(cleanQuery));
  });
}

/** Validate and normalize an international WhatsApp number. */
export function validateWhatsAppNumber(phone: string): {
  isValid: boolean;
  sanitized: string;
  formatted: string;
  error?: string;
} {
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return { isValid: false, sanitized: '', formatted: '', error: 'يرجى إدخال رقم الواتساب' };
  }
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return {
      isValid: false,
      sanitized: digitsOnly,
      formatted: `+${digitsOnly}`,
      error: 'الرقم غير صالح. يجب أن يتراوح بين 8 و 15 رقماً بالصيغة الدولية',
    };
  }
  return { isValid: true, sanitized: digitsOnly, formatted: `+${digitsOnly}` };
}

/** Escape a CSV field and neutralize common spreadsheet formula prefixes. */
function escapeCSV(value = ''): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

/** Export order records as UTF-8 CSV compatible with Arabic Excel workflows. */
export function exportOrdersToCSV(orders: OrderRequest[]): string {
  const headers = [
    'معرف الطلب', 'الاسم / صاحب المناسبة', 'العمل الصوتي', 'كود العمل',
    'نوع التعديل', 'تاريخ المناسبة', 'رقم التواصل', 'تاريخ ووقت الطلب',
    'الحالة', 'ملاحظات إضافية',
  ];
  const rows = orders.map((order) => [
    escapeCSV(order.id),
    escapeCSV(order.clientNames),
    escapeCSV(order.trackTitle),
    escapeCSV(order.trackCode),
    escapeCSV(order.modificationType),
    escapeCSV(order.occasionDate || 'غير محدد'),
    escapeCSV(order.phone || 'غير مسجل'),
    escapeCSV(order.timestamp),
    escapeCSV(order.status),
    escapeCSV(order.notes || ''),
  ]);
  return `\uFEFF${[headers.join(','), ...rows.map((row) => row.join(','))].join('\n')}`;
}

export interface FullBackupData {
  exportedAt: string;
  studioName: string;
  settings: Record<string, string>;
  tracks: Track[];
  categories: Array<{ id: string; name: string; count: number; image: string; description: string }>;
  orders: OrderRequest[];
}

/** Serialize a typed backup payload without accepting arbitrary values. */
export function exportFullBackupJSON(data: FullBackupData): string {
  return JSON.stringify(data, null, 2);
}
