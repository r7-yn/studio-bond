import React, { useEffect, useState } from "react";
import { Check, Edit3, Palette, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  AppThemeSettings,
  OfferPackage,
  OfferType,
  SeasonalThemeKey,
  ThemeMode,
} from "../types/index";
import { adminMutate } from "../services/catalogDb";

interface OffersAdminPanelProps {
  offers: OfferPackage[];
  themeSettings: AppThemeSettings;
  csrfToken: string;
  theme: ThemeMode;
  onRefresh: () => Promise<void> | void;
}

type OfferForm = Omit<
  OfferPackage,
  | "id"
  | "createdAt"
  | "badge"
  | "description"
  | "bannerUrl"
  | "priceOriginal"
  | "priceCurrent"
  | "startDate"
  | "endDate"
> & {
  badge: string;
  description: string;
  bannerUrl: string;
  priceOriginal: number | undefined;
  priceCurrent: number | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
};

const emptyForm: OfferForm = {
  title: "",
  badge: "",
  description: "",
  type: "text_card",
  bannerUrl: "",
  features: [],
  priceOriginal: undefined,
  priceCurrent: undefined,
  currency: "ر.س",
  ctaText: "طلب الباقة عبر واتساب",
  whatsappMessageTemplate: "",
  isActive: true,
  displayOrder: 0,
  startDate: undefined,
  endDate: undefined,
};

const themeOptions: Array<{ value: SeasonalThemeKey; label: string }> = [
  { value: "default", label: "الافتراضي" },
  { value: "ramadan", label: "رمضان" },
  { value: "eid", label: "العيد" },
  { value: "national_day", label: "اليوم الوطني" },
  { value: "wedding_season", label: "موسم الأعراس" },
];

function inputClass(isDark: boolean): string {
  return `w-full min-h-11 px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-o-primary ${
    isDark ? "bg-black/30 border-white/10 text-white" : "bg-gray-50 border-black/10 text-black"
  }`;
}

function fieldLabelClass(): string {
  return "block text-xs font-semibold mb-1.5";
}

function dateInputValue(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateInputBoundary(value: string, isEnd: boolean): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T${isEnd ? "23:59:59.999" : "00:00:00.000"}`).toISOString();
}

export const OffersAdminPanel: React.FC<OffersAdminPanelProps> = ({
  offers,
  themeSettings,
  csrfToken,
  theme,
  onRefresh,
}) => {
  const isDark = theme === "dark";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>({ ...emptyForm });
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeForm, setThemeForm] = useState<AppThemeSettings>(themeSettings);

  useEffect(() => setThemeForm(themeSettings), [themeSettings]);

  const updateForm = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, displayOrder: offers.length + 1 });
    setFeaturesText("");
  };

  const editOffer = (offer: OfferPackage) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      badge: offer.badge ?? "",
      description: offer.description ?? "",
      type: offer.type,
      bannerUrl: offer.bannerUrl ?? "",
      features: offer.features,
      priceOriginal: offer.priceOriginal,
      priceCurrent: offer.priceCurrent,
      currency: offer.currency,
      ctaText: offer.ctaText,
      whatsappMessageTemplate: offer.whatsappMessageTemplate,
      isActive: offer.isActive,
      displayOrder: offer.displayOrder,
      startDate: offer.startDate,
      endDate: offer.endDate,
    });
    setFeaturesText(offer.features.join("\n"));
  };

  const saveOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.whatsappMessageTemplate.trim()) {
      toast.error("العنوان ورسالة واتساب حقول مطلوبة");
      return;
    }
    if (form.type === "banner_image" && !form.bannerUrl.trim()) {
      toast.error("أدخل رابط صورة آمن للبانر");
      return;
    }

    setSaving(true);
    try {
      await adminMutate(csrfToken, {
        action: "upsertOffer",
        offer: {
          ...(editingId ? { id: editingId } : {}),
          ...form,
          features: featuresText
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      toast.success(editingId ? "تم تحديث العرض" : "تمت إضافة العرض");
      resetForm();
      await onRefresh();
    } catch (error) {
      toast.error("تعذر حفظ العرض", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id: string) => {
    if (!window.confirm("هل تريد حذف هذا العرض نهائياً؟")) return;
    try {
      await adminMutate(csrfToken, { action: "deleteOffer", id });
      toast.success("تم حذف العرض");
      if (editingId === id) resetForm();
      await onRefresh();
    } catch (error) {
      toast.error("تعذر حذف العرض", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const toggleOffer = async (offer: OfferPackage) => {
    try {
      await adminMutate(csrfToken, {
        action: "setOfferActive",
        id: offer.id,
        value: !offer.isActive,
      });
      await onRefresh();
    } catch (error) {
      toast.error("تعذر تغيير حالة العرض", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const saveTheme = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingTheme(true);
    try {
      await adminMutate(csrfToken, { action: "updateThemeSettings", theme: themeForm });
      toast.success("تم حفظ إعدادات الثيم");
      await onRefresh();
    } catch (error) {
      toast.error("تعذر حفظ إعدادات الثيم", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSavingTheme(false);
    }
  };

  const panelClass = `rounded-2xl border p-5 ${
    isDark ? "bg-[#16161C] border-white/10" : "bg-white border-black/10 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <section className={panelClass} aria-labelledby="offer-list-heading">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 id="offer-list-heading" className="font-bold text-lg">
                إدارة العروض والباقات
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                تظهر العروض النشطة فقط للزوار ضمن فترة العرض المحددة.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="min-h-11 px-3 py-2 rounded-xl bg-o-primary text-o-on-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> عرض جديد
            </button>
          </div>

          <div className="space-y-3">
            {offers.length === 0 && (
              <div className="p-5 rounded-xl border border-dashed border-white/10 text-center text-sm text-gray-400">
                لا توجد عروض بعد.
              </div>
            )}
            {offers
              .slice()
              .sort((left, right) => left.displayOrder - right.displayOrder)
              .map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="truncate">{offer.title}</strong>
                      {offer.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-o-primary/20 text-o-primary">
                          {offer.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {offer.priceCurrent != null
                        ? `${offer.priceCurrent} ${offer.currency}`
                        : "السعر عند الطلب"}
                      {" · ترتيب "}
                      {offer.displayOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void toggleOffer(offer)}
                      aria-pressed={offer.isActive}
                      className={`min-h-11 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        offer.isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-gray-500/15 text-gray-400"
                      }`}
                    >
                      {offer.isActive ? "نشط" : "متوقف"}
                    </button>
                    <button
                      type="button"
                      onClick={() => editOffer(offer)}
                      aria-label={`تعديل ${offer.title}`}
                      className="min-h-11 min-w-11 p-2 rounded-lg hover:bg-white/10 text-gray-400 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 mx-auto" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteOffer(offer.id)}
                      aria-label={`حذف ${offer.title}`}
                      className="min-h-11 min-w-11 p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <form onSubmit={saveOffer} className={`${panelClass} space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{editingId ? "تعديل العرض" : "إضافة عرض"}</h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                aria-label="إلغاء تعديل العرض"
                className="min-h-11 min-w-11 text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4 mx-auto" aria-hidden="true" />
              </button>
            )}
          </div>

          <label className={fieldLabelClass()} htmlFor="offer-title">
            عنوان العرض
          </label>
          <input
            id="offer-title"
            required
            maxLength={255}
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="عنوان العرض"
            className={inputClass(isDark)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-badge">
                الشارة
              </label>
              <input
                id="offer-badge"
                maxLength={100}
                value={form.badge}
                onChange={(event) => updateForm("badge", event.target.value)}
                placeholder="الشارة"
                className={inputClass(isDark)}
              />
            </div>
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-type">
                نوع العرض
              </label>
              <select
                id="offer-type"
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value as OfferType)}
                className={inputClass(isDark)}
              >
                <option value="text_card">بطاقة نصية</option>
                <option value="banner_image">بانر بصورة</option>
              </select>
            </div>
          </div>

          <label className={fieldLabelClass()} htmlFor="offer-description">
            الوصف
          </label>
          <textarea
            id="offer-description"
            maxLength={2000}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="وصف موجز للباقة"
            rows={2}
            className={inputClass(isDark)}
          />

          <label className={fieldLabelClass()} htmlFor="offer-features">
            المزايا (ميزة واحدة في كل سطر)
          </label>
          <textarea
            id="offer-features"
            value={featuresText}
            onChange={(event) => setFeaturesText(event.target.value)}
            placeholder={"تنفيذ بالأسماء\nأضف مدة التسليم التي يعتمدها الاستوديو"}
            rows={3}
            className={inputClass(isDark)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-price-original">
                السعر السابق
              </label>
              <input
                id="offer-price-original"
                type="number"
                min="0"
                step="0.01"
                value={form.priceOriginal ?? ""}
                onChange={(event) =>
                  updateForm(
                    "priceOriginal",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                className={inputClass(isDark)}
              />
            </div>
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-price-current">
                السعر الحالي
              </label>
              <input
                id="offer-price-current"
                type="number"
                min="0"
                step="0.01"
                value={form.priceCurrent ?? ""}
                onChange={(event) =>
                  updateForm(
                    "priceCurrent",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                className={inputClass(isDark)}
              />
            </div>
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-currency">
                العملة
              </label>
              <input
                id="offer-currency"
                maxLength={10}
                value={form.currency}
                onChange={(event) => updateForm("currency", event.target.value)}
                className={inputClass(isDark)}
              />
            </div>
          </div>

          {form.type === "banner_image" && (
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-banner-url">
                رابط صورة البانر (HTTPS)
              </label>
              <input
                id="offer-banner-url"
                type="url"
                inputMode="url"
                value={form.bannerUrl}
                onChange={(event) => updateForm("bannerUrl", event.target.value)}
                placeholder="https://example.com/banner.webp"
                className={inputClass(isDark)}
              />
            </div>
          )}

          <label className={fieldLabelClass()} htmlFor="offer-cta-text">
            نص زر الطلب
          </label>
          <input
            id="offer-cta-text"
            maxLength={100}
            value={form.ctaText}
            onChange={(event) => updateForm("ctaText", event.target.value)}
            className={inputClass(isDark)}
          />

          <label className={fieldLabelClass()} htmlFor="offer-whatsapp-message">
            رسالة واتساب
          </label>
          <textarea
            id="offer-whatsapp-message"
            required
            maxLength={4000}
            value={form.whatsappMessageTemplate}
            onChange={(event) => updateForm("whatsappMessageTemplate", event.target.value)}
            placeholder="الرسالة التي ستفتح في واتساب عند طلب الباقة"
            rows={3}
            className={inputClass(isDark)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-start-date">
                يبدأ في
              </label>
              <input
                id="offer-start-date"
                type="date"
                value={dateInputValue(form.startDate)}
                onChange={(event) =>
                  updateForm("startDate", dateInputBoundary(event.target.value, false))
                }
                className={inputClass(isDark)}
              />
            </div>
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-end-date">
                ينتهي في
              </label>
              <input
                id="offer-end-date"
                type="date"
                value={dateInputValue(form.endDate)}
                onChange={(event) =>
                  updateForm("endDate", dateInputBoundary(event.target.value, true))
                }
                className={inputClass(isDark)}
              />
            </div>
            <div>
              <label className={fieldLabelClass()} htmlFor="offer-display-order">
                ترتيب العرض
              </label>
              <input
                id="offer-display-order"
                type="number"
                min="0"
                step="1"
                value={form.displayOrder}
                onChange={(event) => updateForm("displayOrder", Number(event.target.value))}
                className={inputClass(isDark)}
              />
            </div>
          </div>

          <label className="flex min-h-11 items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            نشر العرض فوراً
          </label>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 w-full rounded-xl bg-o-primary text-o-on-primary font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? "جارٍ الحفظ..." : "حفظ العرض"}
          </button>
        </form>
      </div>

      <form onSubmit={saveTheme} className={panelClass}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-o-primary/15 text-o-primary flex items-center justify-center">
            <Palette className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold">الثيمات والتحيات</h3>
            <p className="text-xs text-gray-400">
              تحكم مركزي في الثيم الموسمي وظهور التحية الزمنية والعروض.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-xs font-semibold" htmlFor="active-seasonal-theme">
            الثيم النشط
            <select
              id="active-seasonal-theme"
              value={themeForm.activeTheme}
              onChange={(event) =>
                setThemeForm((current) => ({
                  ...current,
                  activeTheme: event.target.value as SeasonalThemeKey,
                }))
              }
              className={`${inputClass(isDark)} mt-2`}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={themeForm.forceThemeOverride}
              onChange={(event) =>
                setThemeForm((current) => ({
                  ...current,
                  forceThemeOverride: event.target.checked,
                }))
              }
            />
            فرض الثيم المختار
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={themeForm.enableTimeGreetings}
              onChange={(event) =>
                setThemeForm((current) => ({
                  ...current,
                  enableTimeGreetings: event.target.checked,
                }))
              }
            />
            تفعيل التحيات الزمنية
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={themeForm.enableOffersSection}
              onChange={(event) =>
                setThemeForm((current) => ({
                  ...current,
                  enableOffersSection: event.target.checked,
                }))
              }
            />
            إظهار قسم العروض
          </label>
        </div>
        <button
          type="submit"
          disabled={savingTheme}
          className="mt-5 min-h-11 px-5 py-2.5 rounded-xl bg-o-primary text-o-on-primary font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          {savingTheme ? "جارٍ الحفظ..." : "حفظ إعدادات الثيم"}
        </button>
      </form>
    </div>
  );
};
