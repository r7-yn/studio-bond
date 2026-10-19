import React, { useState } from "react";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Music,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  LayoutDashboard,
  Heart,
  Bot,
} from "lucide-react";
import { ThemeMode, AppView } from "../types/index";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentView: AppView;
  onNavigate: (view: AppView, categoryId?: string) => void;
  onOpenSearch: () => void;
  onQuickOrder: () => void;
  onOpenConcierge: () => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentView,
  onNavigate,
  onOpenSearch,
  onQuickOrder,
  onOpenConcierge,
  favoritesCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = theme === "dark";

  const navLinks = [
    { label: "الرئيسية", view: "home" as AppView },
    { label: "جميع الأعمال", view: "catalog" as AppView },
    { label: "فنانو أوركست", view: "artists" as AppView },
    { label: "زفات عروس", view: "catalog" as AppView, categoryId: "zaffat-bride" },
    { label: "شيلات ترحيبية", view: "catalog" as AppView, categoryId: "welcoming" },
    { label: "لوحة التحكم", view: "admin" as AppView },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-colors duration-200 border-b backdrop-blur-md ${
          isDark
            ? "bg-[#0B0B0E]/90 border-white/10 text-[#F3F4F6]"
            : "bg-[#FFFFFF]/90 border-black/5 text-[#111827] shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="فتح القائمة الرئيسية"
              className={`lg:hidden p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "border-white/10 text-white hover:bg-white/5"
                  : "border-black/10 text-black hover:bg-black/5"
              }`}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* Logo & Brand */}
            <div
              onClick={() => onNavigate("home")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {/* Golden Soundwave Graphic */}
              <div className="relative flex items-center gap-[3px] h-9 px-2.5 py-1 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <span className="w-1 h-3 rounded-full bg-[#D4AF37] group-hover:h-5 transition-all duration-300" />
                <span className="w-1 h-6 rounded-full bg-[#D4AF37] group-hover:h-7 transition-all duration-300" />
                <span className="w-1 h-8 rounded-full bg-[#D4AF37] group-hover:h-4 transition-all duration-300" />
                <span className="w-1 h-5 rounded-full bg-[#D4AF37] group-hover:h-8 transition-all duration-300" />
                <span className="w-1 h-2 rounded-full bg-[#D4AF37] group-hover:h-4 transition-all duration-300" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#D4AF37]">
                    أوركست
                  </span>
                  <span className="text-xs font-semibold tracking-wider opacity-70 uppercase font-sans">
                    Orchest
                  </span>
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium tracking-normal ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}
                >
                  منصة الزفات الخليجية والشيلات
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link, idx) => {
              const isActive = currentView === link.view && (!link.categoryId || true);
              return (
                <button
                  key={idx}
                  onClick={() => onNavigate(link.view, link.categoryId)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    currentView === link.view
                      ? isDark
                        ? "text-[#D4AF37] bg-white/5 font-semibold"
                        : "text-[#B89728] bg-black/5 font-semibold"
                      : isDark
                        ? "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                        : "text-[#6B7280] hover:text-black hover:bg-black/5"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="بحث فوري في الأعمال"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-sm ${
                isDark
                  ? "border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/5 text-[#9CA3AF] hover:text-[#D4AF37]"
                  : "border-black/10 hover:border-[#B89728]/50 hover:bg-black/5 text-[#6B7280] hover:text-[#B89728]"
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-xs">بحث سريع...</span>
              <kbd
                className="hidden lg:inline rounded border border-o-border px-1 text-[10px] font-mono text-o-muted"
                dir="ltr"
              >
                ⌘K
              </kbd>
            </button>

            {/* Favorites Icon (Hidden on very small mobile since it is in bottom dock) */}
            <button
              onClick={() => onNavigate("favorites")}
              aria-label="الأعمال المفضلة"
              className={`hidden sm:flex relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isDark
                  ? "border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/5 text-[#9CA3AF] hover:text-[#D4AF37]"
                  : "border-black/10 hover:border-[#B89728]/50 hover:bg-black/5 text-[#6B7280] hover:text-[#B89728]"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${favoritesCount > 0 ? "text-rose-500 fill-rose-500" : ""}`}
              />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الليلي"}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isDark
                  ? "border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/5 text-[#D4AF37]"
                  : "border-black/10 hover:border-[#B89728]/50 hover:bg-black/5 text-[#B89728]"
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenConcierge}
              aria-label="فتح مساعد أوركست الذكي"
              className={`hidden sm:flex p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isDark
                  ? "border-o-primary/30 text-o-primary hover:bg-o-primary/10"
                  : "border-o-primary/40 text-o-primary-hover hover:bg-o-primary/10"
              }`}
            >
              <Bot className="w-4 h-4" />
            </button>

            {/* CTA: Order Now Button (Desktop & Tablet) */}
            <button
              onClick={onQuickOrder}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md cursor-pointer bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black hover:opacity-95 hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>اطلب زفتك الآن</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (القائمة الجانبية) matching design sheet item 2 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div
            className={`fixed inset-y-0 right-0 w-4/5 max-w-xs p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ${
              isDark
                ? "bg-[#0B0B0E] text-white border-l border-white/10"
                : "bg-white text-black border-l border-black/10"
            }`}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 h-4 bg-[#D4AF37] rounded-full" />
                    <span className="w-1 h-6 bg-[#D4AF37] rounded-full" />
                    <span className="w-1 h-3 bg-[#D4AF37] rounded-full" />
                  </div>
                  <span className="text-xl font-bold text-[#D4AF37]">أوركست</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 flex flex-col gap-2">
                {navLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(link.view, link.categoryId);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-right text-base font-medium transition-all ${
                      currentView === link.view
                        ? "bg-[#D4AF37]/15 text-[#D4AF37] font-bold"
                        : isDark
                          ? "text-gray-300 hover:bg-white/5"
                          : "text-gray-700 hover:bg-black/5"
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-xs opacity-50">‹</span>
                  </button>
                ))}

                <button
                  onClick={() => {
                    onNavigate("favorites");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-right text-base font-medium transition-all ${
                    currentView === "favorites"
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] font-bold"
                      : isDark
                        ? "text-gray-300 hover:bg-white/5"
                        : "text-gray-700 hover:bg-black/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>المفضلة</span>
                  </div>
                  {favoritesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              {/* Theme Switcher in Drawer */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5">
                <span className="text-sm">وضع الإضاءة</span>
                <button
                  onClick={onToggleTheme}
                  className="p-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37]"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              {/* Order Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onQuickOrder();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>اطلب زفتك الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
