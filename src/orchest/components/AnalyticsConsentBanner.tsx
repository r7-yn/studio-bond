import React, { useEffect, useState } from "react";
import { getGa4Consent, isGa4Configured, saveGa4Consent } from "../services/ga4";

export const AnalyticsConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isGa4Configured()) return;
    const consent = getGa4Consent();
    if (consent === "accepted") saveGa4Consent("accepted");
    setVisible(consent === null);
  }, []);

  if (!visible || !isGa4Configured()) return null;
  const choose = (value: "accepted" | "declined") => {
    saveGa4Consent(value);
    setVisible(false);
  };

  return (
    <aside
      dir="rtl"
      aria-label="تفضيلات قياس الاستخدام"
      className="fixed inset-x-3 bottom-20 z-[70] mx-auto max-w-xl rounded-2xl border border-o-border bg-o-surface p-4 shadow-2xl sm:bottom-5"
    >
      <p className="text-sm font-bold text-o-text">قياس استخدام الموقع</p>
      <p className="mt-1 text-xs leading-6 text-o-muted">
        نستخدم Google Analytics لقياس تشغيل الأعمال وفتح الطلب والنقر إلى واتساب، بعد موافقتك فقط.
        النقر لا يعني أن محادثة واتساب اكتملت.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="min-h-10 rounded-lg bg-o-primary px-4 text-sm font-bold text-o-on-primary"
        >
          موافق
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="min-h-10 rounded-lg border border-o-border px-4 text-sm font-semibold text-o-text"
        >
          لا أوافق
        </button>
      </div>
    </aside>
  );
};
