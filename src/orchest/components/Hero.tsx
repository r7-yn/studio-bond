import React from "react";
import { Search, Sparkles, ArrowDown, Moon, Crown, Heart, Flag } from "lucide-react";
import { AppThemeSettings, ThemeMode, CategoryId } from "../types/index";
import { getCulturalGreeting, getSeasonalTheme } from "../utils/cultural";

interface HeroProps {
  theme: ThemeMode;
  themeSettings: AppThemeSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  theme,
  themeSettings,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onExploreClick,
}) => {
  const isDark = theme === "dark";
  const culturalGreeting = getCulturalGreeting();
  const seasonalTheme = getSeasonalTheme(
    new Date(),
    themeSettings.forceThemeOverride ? themeSettings.activeTheme : undefined,
  );
  const SeasonalIcon = {
    moon: Moon,
    sparkles: Sparkles,
    crown: Crown,
    heart: Heart,
    flag: Flag,
  }[seasonalTheme.icon];

  const categoryPills: { id: CategoryId; label: string }[] = [
    { id: "all", label: "جميع الأعمال" },
    { id: "zaffat-bride", label: "زفات عروس" },
    { id: "sheilat-enthusiastic", label: "شيلات حماسية" },
    { id: "welcoming", label: "ترحيبية" },
    { id: "babies", label: "مواليد" },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-16 sm:pb-20">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[300px] bg-o-primary/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* Decorative animated sound wave */}
      <div
        className="absolute inset-x-0 top-1/3 -z-10 flex items-center justify-center gap-1.5 h-40 pointer-events-none opacity-35"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className="w-1 sm:w-1.5 rounded-full bg-o-primary/40 animate-[orchest-wave_3.2s_ease-in-out_infinite]"
            style={{
              height: `${30 + Math.abs(Math.sin(i * 0.55)) * 70}%`,
              animationDelay: `${(i % 9) * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-full border border-o-primary/30 bg-o-primary/10 mb-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-o-primary">
            <SeasonalIcon className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-bold">
              {themeSettings.enableTimeGreetings ? culturalGreeting.greeting : seasonalTheme.label}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-o-muted">
            {seasonalTheme.greeting} •{" "}
            {themeSettings.enableTimeGreetings ? culturalGreeting.subtext : seasonalTheme.subtext}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.25] sm:leading-[1.2] mb-4">
          اصنع زفافك أو مناسبتك <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent">
            ببصمة صوتية ملكية لا تُنسى
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={`text-sm sm:text-lg max-w-2xl mx-auto font-medium mb-8 ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}
        >
          زفات • شيلات • مقطوعات خاصة • تنفيذ حصري حسب الطلب بالأسماء
        </p>

        {/* Prominent Search Bar */}
        <div className="max-w-2xl mx-auto relative mb-6">
          <div
            className={`flex items-center gap-3 p-2 rounded-2xl border transition-all duration-300 shadow-xl ${
              isDark
                ? "bg-[#16161C] border-white/10 focus-within:border-[#D4AF37]/60 focus-within:shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                : "bg-white border-black/10 focus-within:border-[#B89728]/60 focus-within:shadow-[0_4px_25px_rgba(184,151,40,0.2)]"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن زفة، منشد، أو كلمة مفتاحية..."
              aria-label="ابحث عن زفة أو منشد"
              className={`w-full bg-transparent text-sm sm:text-base outline-none font-medium ${
                isDark ? "text-white placeholder-gray-500" : "text-black placeholder-gray-400"
              }`}
            />

            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Swipeable Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar px-2 max-w-3xl mx-auto mb-8">
          {categoryPills.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onSelectCategory(pill.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/25"
                    : isDark
                      ? "bg-[#16161C] border border-white/10 text-gray-300 hover:border-[#D4AF37]/40"
                      : "bg-white border border-black/10 text-gray-700 hover:border-[#B89728]/40 shadow-sm"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Hero CTA Button */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onExploreClick}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black shadow-lg shadow-[#D4AF37]/20 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95"
          >
            <span>استعرض الأعمال المميزة</span>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
