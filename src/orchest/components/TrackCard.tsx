import { toast } from "sonner";
import React from "react";
import { Play, Pause, Heart, Share2, MessageCircle, Sparkles, ArrowLeftRight } from "lucide-react";
import { Track, ThemeMode } from "../types/index";
import { WaveformPreview } from "./WaveformPreview";

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onOpenDetails: () => void;
  onOrderClick: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onToggleCompare?: (track: Track) => void;
  isCompared?: boolean;
  theme: ThemeMode;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onOpenDetails,
  onOrderClick,
  isFavorite,
  onToggleFavorite,
  onToggleCompare,
  isCompared = false,
  theme,
}) => {
  const isDark = theme === "dark";

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/tracks/${track.code.replace("#", "")}`;
    if (navigator.share) {
      navigator
        .share({
          title: track.title,
          text: `استمع إلى ${track.title} - المنشد: ${track.artist}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ رابط الزفة");
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare?.(track);
  };

  return (
    <div
      onClick={onOpenDetails}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
        isDark
          ? "bg-[#16161C] border-white/10 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-black/50"
          : "bg-white border-black/10 hover:border-[#B89728]/50 hover:shadow-lg"
      }`}
    >
      {/* Thumbnail & Badges Container */}
      <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-black/20">
        <img
          src={track.coverUrl}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-10">
          {/* Rhythm Badge */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/20">
            {track.rhythm}
          </span>

          {/* Trend / Exclusive Badge */}
          {track.isExclusive ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-black flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>حصري</span>
            </span>
          ) : track.isTrend ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md">
              ترند
            </span>
          ) : null}
        </div>

        {/* Live sound bars while this track plays */}
        {isPlaying && (
          <div
            className="absolute bottom-3 inset-x-0 flex items-end justify-center gap-[3px] h-6 pointer-events-none"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-o-primary origin-bottom animate-[orchest-bar_0.9s_ease-in-out_infinite]"
                style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}

        {/* Center/Quick Play Button */}
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? `إيقاف مؤقت ${track.title}` : `تشغيل ${track.title}`}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
            isPlaying
              ? "bg-[#D4AF37] text-black scale-110 shadow-[0_0_20px_rgba(212,175,55,0.6)]"
              : "bg-black/60 hover:bg-[#D4AF37] text-white hover:text-black hover:scale-105 backdrop-blur-md border border-white/30"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
          )}
        </button>

        {/* Bottom Bar on Thumbnail: Duration & Code */}
        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-[11px] text-white/90 font-mono z-10">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs">
            {track.durationFormatted}
          </span>
          <span dir="ltr" className="opacity-80">
            {track.code}
          </span>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title and Artist */}
          <h3 className="font-bold text-base sm:text-lg tracking-tight line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
            {track.title}
          </h3>

          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs font-medium ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
              المنشد: {track.artist}
            </span>
          </div>
          <WaveformPreview trackId={track.id} theme={theme} />
        </div>

        {/* Interactive Action Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
          {/* Favorite Button */}
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isFavorite
                ? "bg-rose-500/10 border-rose-500/40 text-rose-500"
                : isDark
                  ? "border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                  : "border-black/10 hover:border-black/20 text-gray-500 hover:text-black"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="مشاركة الزفة"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? "border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                : "border-black/10 hover:border-black/20 text-gray-500 hover:text-black"
            }`}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleCompare}
            aria-label={isCompared ? "إزالة من المقارنة" : "إضافة إلى المقارنة"}
            title={isCompared ? "إزالة من المقارنة" : "إضافة إلى المقارنة"}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isCompared
                ? "border-o-primary/60 bg-o-primary/10 text-o-primary"
                : isDark
                  ? "border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                  : "border-black/10 hover:border-black/20 text-gray-500 hover:text-black"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Direct WhatsApp Order CTA Button */}
          <button
            onClick={onOrderClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black hover:opacity-95 shadow-sm active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 text-black" />
            <span className="truncate">اطلب هذه الزفة باسمك</span>
          </button>
        </div>
      </div>
    </div>
  );
};
