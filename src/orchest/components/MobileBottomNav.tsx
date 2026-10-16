import React from 'react';
import { Home, Music, Heart, MessageCircle, Users } from 'lucide-react';
import { AppView, ThemeMode } from '../types/index';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  favoritesCount: number;
  onWhatsAppContact: () => void;
  theme: ThemeMode;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
  onWhatsAppContact,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`sm:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t backdrop-blur-xl flex items-center justify-around px-2 ${
        isDark
          ? 'bg-[#0B0B0E]/95 border-white/10 text-gray-400'
          : 'bg-white/95 border-black/10 text-gray-600'
      }`}
    >
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer transition-colors ${
          currentView === 'home' ? 'text-[#D4AF37] font-bold' : 'hover:text-white'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">الرئيسية</span>
      </button>

      <button
        onClick={() => onNavigate('catalog')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer transition-colors ${
          currentView === 'catalog' ? 'text-[#D4AF37] font-bold' : 'hover:text-white'
        }`}
      >
        <Music className="w-5 h-5" />
        <span className="text-[10px]">الأعمال</span>
      </button>

      <button
        onClick={() => onNavigate('artists')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer transition-colors ${
          currentView === 'artists' || currentView === 'artist-details' ? 'text-[#D4AF37] font-bold' : 'hover:text-white'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">الفنانون</span>
      </button>

      <button
        onClick={() => onNavigate('favorites')}
        className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer transition-colors ${
          currentView === 'favorites' ? 'text-[#D4AF37] font-bold' : 'hover:text-white'
        }`}
      >
        <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
        <span className="text-[10px]">المفضلة</span>
        {favoritesCount > 0 && (
          <span className="absolute top-1 right-1/4 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {favoritesCount}
          </span>
        )}
      </button>

      <button
        onClick={onWhatsAppContact}
        className="flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer text-[#25D366] hover:opacity-90 font-bold"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="text-[10px]">تواصل معنا</span>
      </button>
    </div>
  );
};
