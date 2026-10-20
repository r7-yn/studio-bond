import { toast } from 'sonner';
import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Heart, 
  Share2, 
  ChevronRight, 
  Clock, 
  Check, 
  MessageCircle, 
  Sparkles,
  Star,
  ShieldCheck,
  Headphones
} from 'lucide-react';
import { Track, ThemeMode } from '../types/index';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TrackCard } from './TrackCard';
import { formatDuration } from '../utils/trackLogic';

interface TrackDetailsViewProps {
  track: Track;
  allTracks: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onOrderClick: () => void;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  theme: ThemeMode;
  onOrderOtherTrack: (t: Track) => void;
  favorites: string[];
  onToggleFavoriteTrack: (trackId: string) => void;
}

export const TrackDetailsView: React.FC<TrackDetailsViewProps> = ({
  track,
  allTracks,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onOrderClick,
  onBack,
  onSelectTrack,
  isFavorite,
  onToggleFavorite,
  theme,
  onOrderOtherTrack,
  favorites,
  onToggleFavoriteTrack,
}) => {
  const isDark = theme === 'dark';

  // Similar tracks from same category or rhythm
  const similarTracks = allTracks
    .filter((t) => t.id !== track.id && (t.categoryId === track.categoryId || t.rhythm === track.rhythm))
    .slice(0, 4);

  const handleShare = () => {
    const url = `${window.location.origin}/tracks/${track.code.replace('#', '')}`;
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `استمع إلى ${track.title} - استوديو أوركست`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط العمل');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm mb-6 text-gray-400">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors cursor-pointer font-medium"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة للأعمال</span>
        </button>
        <span>/</span>
        <span className="opacity-70">{track.categoryLabel}</span>
        <span>/</span>
        <span className="text-[#D4AF37] font-semibold truncate">{track.title}</span>
      </div>

      {/* Main Track Detail Card */}
      <div
        className={`rounded-3xl border overflow-hidden transition-all shadow-2xl ${
          isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10'
        }`}
      >
        <div className="p-6 sm:p-8 lg:p-10">
          {/* Header row: Thumbnail + Details */}
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            {/* Cover Image */}
            <div className="relative w-full md:w-64 lg:w-72 aspect-square rounded-2xl overflow-hidden shadow-xl shrink-0 group">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              <button
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current translate-x-[-2px]" />
                  )}
                </div>
              </button>

              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white">
                <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                  {track.durationFormatted}
                </span>
                <span className="font-mono">{track.code}</span>
              </div>
            </div>

            {/* Track Info & Meta */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {track.isExclusive && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-black flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>حصري</span>
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/20 bg-black/40 text-white">
                  {track.rhythm}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  {track.categoryLabel}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                {track.title}
              </h1>

              <div className="flex items-center gap-3 text-sm sm:text-base font-medium mb-4 text-[#9CA3AF]">
                <span>المنشد: <strong className="text-white">{track.artist}</strong></span>
                <span>•</span>
                <span>كود العمل: <strong dir="ltr" className="font-mono text-[#D4AF37]">{track.code}</strong></span>
              </div>

              <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {track.description}
              </p>

              {/* Share/Favorite actions */}
              <div className="flex items-center gap-6 text-sm mb-6 pb-6 border-b border-white/10">
                <div className="mr-auto flex items-center gap-2">
                  <button
                    onClick={onToggleFavorite}
                    aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isFavorite
                        ? 'bg-rose-500/15 border-rose-500 text-rose-500'
                        : isDark
                        ? 'border-white/10 hover:border-white/30 text-gray-400'
                        : 'border-black/10 hover:border-black/30 text-gray-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleShare}
                    aria-label="مشاركة العمل"
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isDark
                        ? 'border-white/10 hover:border-white/30 text-gray-400'
                        : 'border-black/10 hover:border-black/30 text-gray-600'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Audio Player & Waveform */}
              <div
                className={`p-4 sm:p-6 rounded-2xl border mb-6 ${
                  isDark ? 'bg-[#0B0B0E]/60 border-white/10' : 'bg-gray-50 border-black/10'
                }`}
              >
                {/* Waveform Graphic */}
                <div className="mb-4">
                  <WaveformVisualizer
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    onSeek={onSeek}
                    theme={theme}
                    height={56}
                    trackId={track.id}
                  />
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between gap-4">
                  {/* Time Counters */}
                  <div className="text-xs sm:text-sm font-mono text-gray-400">
                    <span>{formatDuration(currentTime)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatDuration(duration)}</span>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSkip(-10)}
                      aria-label="تأخير 10 ثوانٍ"
                      className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                      onClick={onTogglePlay}
                      aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                      className="w-12 h-12 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
                      )}
                    </button>

                    <button
                      onClick={() => onSkip(10)}
                      aria-label="تقديم 10 ثوانٍ"
                      className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={onToggleMute}
                      aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-[#D4AF37] cursor-pointer"
                      aria-label="مستوى الصوت"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Customization Grid matching Screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/10">
            {/* Card 1: خيارات التعديل المتاحة */}
            <div
              className={`p-6 rounded-2xl border ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-black/10'
              }`}
            >
              <h3 className="font-bold text-lg mb-4 text-[#D4AF37] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>خيارات التعديل المتاحة</span>
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>تغيير أسماء العروسين وصاحب المناسبة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>إضافة مقدمة صوتية أو شعر خاص بالأسماء</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>تعديل الإيقاع (بدون موسيقى، دفوف، أو أوركسترا)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>تخصيص كامل حسب تفاصيل القاعة والمسيرة</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>مدة التنفيذ والتسليم: <strong>{track.executionDays}</strong></span>
              </div>
            </div>

            {/* Card 2: تفاصيل العمل الفنية */}
            <div
              className={`p-6 rounded-2xl border ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-black/10'
              }`}
            >
              <h3 className="font-bold text-lg mb-4 text-[#D4AF37] flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>تفاصيل العمل الفنية</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">المنشد</span>
                  <span className="font-semibold">{track.artist}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">نوع الإيقاع</span>
                  <span className="font-semibold">{track.rhythm}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">الكلمات</span>
                  <span className="font-semibold">متوفرة ومكتوبة</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">كود العمل</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{track.code}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 block mb-1">مناسب لـ</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {track.suitableFor.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Big CTA Banner Button matching screenshot */}
          <div className="mt-8">
            <button
              onClick={onOrderClick}
              className="w-full py-4 px-6 rounded-2xl text-base sm:text-lg font-black tracking-wide transition-all duration-300 shadow-xl cursor-pointer bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-black hover:opacity-95 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.99] flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6 text-black fill-current" />
              <span>اطلب هذه الزفة باسمك الآن عبر واتساب</span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              توجيه فوري لمحادثة استوديو أوركست مع تجهيز كامل التفاصيل والكود
            </p>
          </div>
        </div>
      </div>

      {/* Customer Trust & Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-10">
        <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
          <Headphones className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
          <h4 className="font-bold text-sm">استماع فوري مباشر</h4>
          <p className="text-xs text-gray-400 mt-1">معاينة نقية بأعلى جودة استوديو</p>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
          <h4 className="font-bold text-sm">تعديل مخصص بالأسماء</h4>
          <p className="text-xs text-gray-400 mt-1">تنسيق فوري لكلمات العروسين</p>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
          <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
          <h4 className="font-bold text-sm">ضمان الجودة والدقة</h4>
          <p className="text-xs text-gray-400 mt-1">تسجيل احترافي ومراجعة فنية</p>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
          <Clock className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
          <h4 className="font-bold text-sm">سرعة في التنفيذ</h4>
          <p className="text-xs text-gray-400 mt-1">استلام في الوقت المحدد لمناسبتك</p>
        </div>
      </div>

      {/* Retention Loop: Similar Tracks (أعمال مشابهة قد تعجبك) */}
      {similarTracks.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">أعمال مشابهة قد تعجبك</h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                بناءً على اختيارك للقسم والإيقاع الصوتي
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarTracks.map((simTrack) => (
              <TrackCard
                key={simTrack.id}
                track={simTrack}
                isPlaying={isPlaying && track.id === simTrack.id}
                onTogglePlay={(e) => {
                  e.stopPropagation();
                  onSelectTrack(simTrack);
                }}
                onOpenDetails={() => onSelectTrack(simTrack)}
                onOrderClick={(e) => {
                  e.stopPropagation();
                  onOrderOtherTrack(simTrack);
                }}
                isFavorite={favorites.includes(simTrack.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteTrack(simTrack.id);
                }}
                theme={theme}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
