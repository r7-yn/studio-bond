export const ORDER_STEPS = ['الاختيار', 'التفاصيل', 'التأكيد'] as const;
export type OrderStep = 0 | 1 | 2;

export interface OrderForm {
  clientNames: string;
  modificationType: string;
  occasionDate: string;
  notes: string;
  phone: string;
}

/** Returns an Arabic error message when the given step is incomplete, otherwise null. */
export function validateOrderStep(step: OrderStep, form: OrderForm): string | null {
  if (step === 0) return form.modificationType.trim() ? null : 'يرجى اختيار نوع الطلب';
  if (step === 1) {
    const names = form.clientNames.trim();
    if (!names) return 'يرجى كتابة أسماء العروسين أو صاحب المناسبة';
    if (names.length > 120) return 'الأسماء طويلة جداً. الحد الأقصى 120 حرفاً.';
    if (form.notes.trim().length > 500) return 'الملاحظات طويلة جداً. الحد الأقصى 500 حرف.';
    if (form.phone.trim() && !/^\+?[0-9\s-]{8,16}$/.test(form.phone.trim())) return 'رقم التواصل غير صحيح';
  }
  return null;
}
