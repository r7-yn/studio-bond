import { test } from 'vitest';
import assert from 'node:assert/strict';
import { 
  formatDuration,
  parseDuration,
  formatNumberK, 
  calculateConversionRate, 
  generateWhatsAppMessage, 
  filterTracks,
  validateWhatsAppNumber,
  exportOrdersToCSV,
  generateWhatsAppUrl
} from './trackLogic';
import type { Track } from '../types/index';

const sampleTrack: Track = {
  id: 'track-1',
  title: 'زفة عروس فخمة',
  artist: 'محمد العتيبي',
  code: '#ORC-204',
  duration: 272,
  durationFormatted: '04:32',
  playsCount: 12400,
  likesCount: 892,
  rhythm: 'بدون موسيقى',
  categoryId: 'zaffat-bride',
  categoryLabel: 'زفات عروس',
  coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
  executionDays: '1-3 أيام',
  suitableFor: ['زفاف', 'خطوبة'],
  createdAt: '2026-10-01',
  description: 'زفة كلاسيكية ملكية بطابع خليجي ساحر',
};

test('formatDuration converts seconds to MM:SS correctly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(272), '04:32');
  assert.equal(formatDuration(-10), '00:00');
});

test('parseDuration accepts valid MM:SS and rejects malformed values', () => {
  assert.equal(parseDuration('04:32'), 272);
  assert.equal(parseDuration('0:05'), 5);
  assert.equal(parseDuration('04:60'), null);
  assert.equal(parseDuration('abc'), null);
});

test('formatNumberK formats thousands cleanly', () => {
  assert.equal(formatNumberK(500), '500');
  assert.equal(formatNumberK(12400), '12.4K');
  assert.equal(formatNumberK(8700), '8.7K');
  assert.equal(formatNumberK(1000), '1K');
});

test('calculateConversionRate returns correct percentage', () => {
  assert.equal(calculateConversionRate(4832, 124893), 3.87);
  assert.equal(calculateConversionRate(0, 100), 0);
  assert.equal(calculateConversionRate(50, 0), 0);
});

test('generateWhatsAppMessage builds correct pre-filled Arabic message', () => {
  const msg = generateWhatsAppMessage(sampleTrack, {
    clientNames: 'أحمد ونورة',
    modificationType: 'تغيير الأسماء فقط',
    occasionDate: '2026-11-20',
    notes: 'مع إضافة زغاريد في البداية',
  });

  assert.match(msg, /زفة عروس فخمة/);
  assert.match(msg, /#ORC-204/);
  assert.match(msg, /أحمد ونورة/);
  assert.match(msg, /2026-11-20/);
  assert.match(msg, /مع إضافة زغاريد/);
  assert.match(msg, /https:\/\/orchest\.com\/tracks\/ORC-204/);
});

test('generateWhatsAppUrl rejects invalid phones and encodes Arabic text', () => {
  assert.equal(generateWhatsAppUrl('123', 'hello'), '');
  const url = generateWhatsAppUrl('+967 77 000 0000', 'أهلاً وسهلاً');
  assert.match(url, /^https:\/\/wa\.me\/967770000000\?text=/);
  assert.match(url, /%D8%A3/);
});

test('filterTracks filters by query, category, and rhythm', () => {
  const track2: Track = {
    ...sampleTrack,
    id: 'track-2',
    title: 'شيلة بن خالد',
    artist: 'فهد العتيبي',
    code: '#ORC-109',
    rhythm: 'دفوف',
    categoryId: 'sheilat-enthusiastic',
    categoryLabel: 'شيلات حماسية',
  };

  const list = [sampleTrack, track2];

  // Filter by query
  const queryResult = filterTracks(list, 'بن خالد');
  assert.equal(queryResult.length, 1);
  assert.equal(queryResult[0]?.id, 'track-2');

  // Filter by category
  const catResult = filterTracks(list, '', 'zaffat-bride');
  assert.equal(catResult.length, 1);
  assert.equal(catResult[0]?.id, 'track-1');

  // Filter by rhythm
  const rhythmResult = filterTracks(list, '', 'all', 'دفوف');
  assert.equal(rhythmResult.length, 1);
  assert.equal(rhythmResult[0]?.id, 'track-2');
});

test('validateWhatsAppNumber validates international phone numbers', () => {
  const v1 = validateWhatsAppNumber('+966501234567');
  assert.equal(v1.isValid, true);
  assert.equal(v1.formatted, '+966501234567');

  const v2 = validateWhatsAppNumber('967770000000');
  assert.equal(v2.isValid, true);
  assert.equal(v2.formatted, '+967770000000');

  const v3 = validateWhatsAppNumber('123');
  assert.equal(v3.isValid, false);
  assert.match(v3.error || '', /غير صالح/);
});

test('exportOrdersToCSV outputs valid CSV with UTF-8 BOM and headers', () => {
  const orders = [
    {
      id: 'ord-1',
      trackId: 'track-1',
      trackCode: '#ORC-204',
      trackTitle: 'زفة عروس فخمة',
      clientNames: 'أحمد ونورة',
      modificationType: 'تغيير الأسماء فقط',
      occasionDate: '2026-11-20',
      timestamp: '2026-10-15 14:00',
      status: 'مكتمل' as const,
    },
  ];

  const csv = exportOrdersToCSV(orders);
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /معرف الطلب/);
  assert.match(csv, /أحمد ونورة/);
  assert.match(csv, /#ORC-204/);
});

test('exportOrdersToCSV neutralizes spreadsheet formula values', () => {
  const csv = exportOrdersToCSV([{
    id: 'ord-2',
    trackId: 'track-1',
    trackCode: '#ORC-204',
    trackTitle: '=HYPERLINK("https://example.com")',
    clientNames: '@attacker',
    modificationType: 'تغيير الأسماء فقط',
    occasionDate: '',
    timestamp: '2026-10-15 14:00',
    status: 'جديد',
  }]);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'@attacker/);
});
