import { describe, it, expect } from 'vitest';
import { validateOrderStep, ORDER_STEPS } from './orderSteps';

const base = { clientNames: 'أحمد ونورة', modificationType: 'تغيير الأسماء فقط', occasionDate: '', notes: '', phone: '' };

describe('order steps', () => {
  it('has exactly 3 steps: choose, details, confirm', () => {
    expect(ORDER_STEPS.length).toBe(3);
  });
  it('blocks details step without names', () => {
    expect(validateOrderStep(1, { ...base, clientNames: '  ' })).not.toBeNull();
  });
  it('blocks notes over 500 chars', () => {
    expect(validateOrderStep(1, { ...base, notes: 'x'.repeat(501) })).not.toBeNull();
  });
  it('accepts complete details', () => {
    expect(validateOrderStep(1, base)).toBeNull();
  });
});
