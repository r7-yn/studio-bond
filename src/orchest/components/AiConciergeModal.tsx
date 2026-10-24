import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Play,
  Pause,
  MessageCircle,
  ArrowRight,
  Check,
  Headphones,
  RotateCcw,
} from "lucide-react";
import { Track, ThemeMode } from "../types/index";

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  onOrderTrack: (track: Track, note?: string) => void;
  activeTrackId: string | null;
  isPlaying: boolean;
  theme: ThemeMode;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  recommendedTracks?: Track[];
  recommendations?: Array<{ trackId: string; reason: string }>;
  suggestedModification?: string;
  timestamp: string;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onSelectTrack,
  onOrderTrack,
  activeTrackId,
  isPlaying,
  theme,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: 'يا أهلاً وسهلاً بك في استوديو أوركست! 🎵 ألف مبروك مقدماً لمناسبتكم السعيدة.\n\nأنا "مساعد أوركست الذكي"، متواجد لمساعدتك في انتقاء الزفة الملكية أو الشيلة التي تليق بذوقكم. أخبرني عن مناسبتك (مثلاً: زفاف، ملكة، استقبال)، ونوع الإيقاع المفضل لديك؟',
      timestamp: "الآن",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const quickPrompts = [
    "عندي عرس قريب وأبي زفة فخمة بدون موسيقى تدخل العروس بهدوء",
    "أبي شيلة ترحيبية بالضيوف حماسية بالدفوف لأهل العريس",
    "زفة عروس ملكية كلاسيكية مع إمكانية إضافة أبيات شعر",
    "أبي مقطوعة ناعمة لاستقبال مولود جديد بالأسماء",
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          tracks,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل الاتصال بالمساعد");
      }

      const data = await response.json();
      const matchedTracks = Array.isArray(data.recommendedTrackIds)
        ? data.recommendedTrackIds
            .map((id: string) => tracks.find((t) => t.id === id))
            .filter((t: any): t is Track => Boolean(t))
        : [];
      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations.filter(
            (item: unknown): item is { trackId: string; reason: string } =>
              Boolean(
                item &&
                typeof item === "object" &&
                "trackId" in item &&
                typeof item.trackId === "string" &&
                "reason" in item &&
                typeof item.reason === "string" &&
                tracks.some((track) => track.id === item.trackId),
              ),
          )
        : [];

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "إليك أفضل الأعمال المناسبة لطلبك من كتالوج استوديو أوركست:",
        recommendedTracks: matchedTracks,
        recommendations,
        suggestedModification: data.suggestedModification,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "تعذر الاتصال بخدمة التوصية الآن، لذلك لن أقترح أعمالاً دون مطابقة طلبك. جرّب البحث في الكتالوج أو أعد المحاولة بعد قليل.",
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Chat Window */}
      <div
        className={`relative w-full sm:max-w-xl h-[85vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col z-10 overflow-hidden ${
          isDark ? "bg-[#16161C] border-white/10 text-white" : "bg-white border-black/10 text-black"
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#D4AF37]/15 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] text-black flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">مساعد أوركست الذكي</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini AI</span>
                </span>
              </div>
              <p className="text-xs text-gray-400">
                مستشارك الصوتي لاختيار زفتك وتنسيق التعديلات بالأسماء
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق الدردشة"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                  msg.sender === "user"
                    ? "bg-[#D4AF37] text-black font-semibold rounded-br-xs"
                    : isDark
                      ? "bg-white/5 border border-white/10 text-gray-200 rounded-bl-xs"
                      : "bg-gray-100 border border-black/5 text-gray-800 rounded-bl-xs"
                }`}
              >
                {msg.text}

                {/* Recommended Tracks Cards inside Bot message */}
                {msg.recommendedTracks && msg.recommendedTracks.length > 0 && (
                  <div className="mt-4 space-y-2.5 pt-3 border-t border-white/10 w-full">
                    <span className="text-xs font-bold text-[#D4AF37] block">
                      الأعمال المرشحة لك خصيصاً:
                    </span>
                    {msg.recommendedTracks.map((trk) => {
                      const isCurrentPlaying = isPlaying && activeTrackId === trk.id;
                      const reason = msg.recommendations?.find(
                        (item) => item.trackId === trk.id,
                      )?.reason;
                      return (
                        <div
                          key={trk.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isDark
                              ? "bg-black/40 border-white/10 hover:border-[#D4AF37]/50"
                              : "bg-white border-black/10 shadow-xs"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={trk.coverUrl}
                              alt={trk.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs truncate text-white">{trk.title}</h5>
                              {reason && (
                                <p className="mt-1 text-[10px] leading-5 text-gray-400">{reason}</p>
                              )}
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <span>{trk.artist}</span>
                                <span>•</span>
                                <span className="text-[#D4AF37] font-semibold">{trk.rhythm}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Play inside chat */}
                            <button
                              onClick={() => onSelectTrack(trk)}
                              aria-label={isCurrentPlaying ? "إيقاف" : "استماع"}
                              className={`p-2 rounded-lg cursor-pointer ${
                                isCurrentPlaying
                                  ? "bg-[#D4AF37] text-black"
                                  : "bg-white/10 text-white hover:bg-white/20"
                              }`}
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>

                            {/* Direct WhatsApp Order CTA */}
                            <button
                              onClick={() => onOrderTrack(trk, msg.suggestedModification)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#20ba59] cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3 fill-current" />
                              <span>طلب</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 w-32">
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span className="text-xs text-gray-400">جاري التحليل...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 border-t border-white/10 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-black/10 shrink-0">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer ${
                isDark
                  ? "bg-white/5 border-white/10 text-gray-300 hover:border-[#D4AF37]/50"
                  : "bg-white border-black/10 text-gray-700 hover:border-[#B89728]/50"
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="اكتب ما تبحث عنه (مثال: أبي زفة هادية بدون موسيقى للعروس)..."
            className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
              isDark
                ? "bg-black/30 border-white/10 focus:border-[#D4AF37] text-white placeholder-gray-500"
                : "bg-gray-50 border-black/10 focus:border-[#B89728] text-black placeholder-gray-400"
            }`}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            aria-label="إرسال"
            className="p-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold disabled:opacity-40 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            <Send className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
