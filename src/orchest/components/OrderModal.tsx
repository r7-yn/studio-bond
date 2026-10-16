import React, { useState } from 'react';
import { X, MessageCircle, Calendar, Sparkles, Send, CheckCircle2, Clock, Music } from 'lucide-react';
import { Track, ThemeMode, OrderRequest } from '../types/index';
import { generateWhatsAppMessage, generateWhatsAppUrl } from '../utils/trackLogic';
import { STUDIO_WHATSAPP_NUMBER } from '../data/mockData';

interface OrderModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (order: OrderRequest) => void;
  theme: ThemeMode;
  whatsappNumber?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  track,
  isOpen,
  onClose,
  onSubmitOrder,
  theme,
  whatsappNumber = STUDIO_WHATSAPP_NUMBER,
}) => {
  const [clientNames, setClientNames] = useState('');
  const [modificationType, setModificationType] = useState('تغيير الأسماء فقط');
  const [occasionDate, setOccasionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const modificationOptions = [
    'تغيير الأسماء فقط',
    'إضافة مقدمة صوتية وشعر خاص بالأسماء',
    'تعديل الإيقاع والمؤثرات (دفوف / بدون موسيقى)',
    'تنفيذ زفة حصرية كاملة من الصفر',
  ];

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!clientNames.trim() || clientNames.trim().length > 120) {
      alert('يرجى كتابة أسماء العروسين أو صاحب المناسبة');
      return;
    }
    if (notes.trim().length > 500) {
      setSubmitError('الملاحظات طويلة جداً. الحد الأقصى 500 حرف.');
      return;
    }

    const orderRecord: OrderRequest = {
      id: `ord-${Date.now()}`,
      trackId: track.id,
      trackCode: track.code,
      trackTitle: track.title,
      clientNames: clientNames.trim(),
      modificationType,
      occasionDate,
      notes: notes.trim(),
      phone: phone.trim() || undefined,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'جديد',
    };

    // Build WhatsApp URL
    const message = generateWhatsAppMessage(track, {
      clientNames,
      modificationType,
      occasionDate,
      notes,
      customPhone: phone,
    });
    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, message);
    if (!whatsappUrl) {
      setSubmitError('رقم واتساب الاستوديو غير صالح حالياً. يرجى المحاولة لاحقاً.');
      return;
    }

    // Open during the submit gesture; delayed window.open calls are often blocked.
    const whatsappWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!whatsappWindow) {
      setSubmitError('تعذر فتح واتساب تلقائياً. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.');
      return;
    }
    whatsappWindow.location.href = whatsappUrl;
    onSubmitOrder(orderRecord);

    setShowSuccess(true);

    setTimeout(() => {
      onClose();
      setShowSuccess(false);
    }, 900);
  };

  const previewMessage = generateWhatsAppMessage(track, {
    clientNames: clientNames || 'أحمد & نورة',
    modificationType,
    occasionDate: occasionDate || '2026-11-20',
    notes,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal / Bottom Sheet */}
      <div
        className={`relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border shadow-2xl p-6 sm:p-8 transition-transform duration-300 z-10 ${
          isDark
            ? 'bg-[#16161C] border-white/10 text-white'
            : 'bg-white border-black/10 text-black'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">طلب الزفة باسمك</h3>
              <p className="text-xs text-gray-400">تنفيذ استوديو أوركست مع إمكانية التعديل الفوري</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق نافذة الطلب"
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Track Preview Badge */}
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border mb-6 ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-black/10'
          }`}
        >
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#D4AF37]/30"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm truncate">{track.title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>المنشد: {track.artist}</span>
              <span>•</span>
              <span dir="ltr" className="font-mono text-[#D4AF37]">{track.code}</span>
              <span>•</span>
              <span>{track.durationFormatted}</span>
            </div>
          </div>
        </div>

        {/* Success Confirmation state */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold mb-2">تم تجهيز طلبك بنجاح!</h4>
            <p className="text-sm text-gray-400">
              جاري نقلك إلى محادثة واتساب الاستوديو لتأكيد التفاصيل...
            </p>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSendOrder} className="space-y-4">
            {/* Field 1: أسماء العروسين */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-300">
                أسماء العروسين / صاحب المناسبة <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                required
                value={clientNames}
                onChange={(e) => setClientNames(e.target.value)}
                placeholder="مثال: أحمد ونورة / عائلة آل سبيعي"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                  isDark
                    ? 'bg-black/40 border-white/10 focus:border-[#D4AF37] text-white placeholder-gray-500'
                    : 'bg-gray-50 border-black/10 focus:border-[#B89728] text-black placeholder-gray-400'
                }`}
              />
            </div>

            {/* Field 2: نوع التعديل المطلوب */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-300">
                نوع التعديل المطلوب
              </label>
              <select
                value={modificationType}
                onChange={(e) => setModificationType(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#16161C] border-white/10 focus:border-[#D4AF37] text-white'
                    : 'bg-gray-50 border-black/10 focus:border-[#B89728] text-black'
                }`}
              >
                {modificationOptions.map((opt, i) => (
                  <option key={i} value={opt} className={isDark ? 'bg-[#16161C] text-white' : 'bg-white text-black'}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: تاريخ المناسبة */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-300">
                تاريخ المناسبة (اختياري)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={occasionDate}
                  onChange={(e) => setOccasionDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                    isDark
                      ? 'bg-black/40 border-white/10 focus:border-[#D4AF37] text-white'
                      : 'bg-gray-50 border-black/10 focus:border-[#B89728] text-black'
                  }`}
                />
              </div>
            </div>

            {/* Field 4: رقم الجوال (اختياري) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-300">
                رقم التواصل للتأكيد (اختياري)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all text-right ${
                  isDark
                    ? 'bg-black/40 border-white/10 focus:border-[#D4AF37] text-white placeholder-gray-500'
                    : 'bg-gray-50 border-black/10 focus:border-[#B89728] text-black placeholder-gray-400'
                }`}
              />
            </div>

            {/* Field 5: ملاحظات إضافية */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-300">
                ملاحظات أو طلبات خاصة باللحن
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: إضافة زغاريد في البداية، تكرار مقطع معين..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none resize-none transition-all ${
                  isDark
                    ? 'bg-black/40 border-white/10 focus:border-[#D4AF37] text-white placeholder-gray-500'
                    : 'bg-gray-50 border-black/10 focus:border-[#B89728] text-black placeholder-gray-400'
                }`}
              />
            </div>

            {/* Live Message Accordion Preview */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="font-bold text-[#D4AF37] block mb-1">
                معاينة نص الرسالة التي ستُرسل إلى واتساب:
              </span>
              <p className="whitespace-pre-line text-gray-300 text-[11px] leading-relaxed line-clamp-3">
                {previewMessage}
              </p>
            </div>

            {/* Final Submit Button */}
            <div className="pt-2 pb-1">
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 shadow-xl cursor-pointer bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-2.5 active:scale-98 shadow-emerald-900/30"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>إرسال الطلب إلى واتساب الاستوديو 🎵</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400">
              سيتم نقلك مباشرة إلى واتساب الاستوديو مع حفظ طلبك في سجل الطلبات
            </p>
            {submitError && (
              <p role="alert" className="text-center text-xs text-red-400">
                {submitError}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
