import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  X,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { Track, ThemeMode } from '../types/index';
import { WaveformVisualizer } from './WaveformVisualizer';
import { formatDuration } from '../utils/trackLogic';

interface StickyAudioPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (seconds: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  error: string | null;
  onOpenDetails: () => void;
  onOrderClick: () => void;
  onClose: () => void;
  theme: ThemeMode;
}

export const StickyAudioPlayer: React.FC<StickyAudioPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onSkip,
  onNext,
  onPrev,
  onVolumeChange,
  onToggleMute,
  error,
  onOpenDetails,
  onOrderClick,
  onClose,
  theme,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isDark = theme === 'dark';
  const touchStartX = useRef<number | null>(null);

  // Lock-screen / headset controls via the Media Session API
  useEffect(() => {
    if (!track || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'استوديو أوركست',
      artwork: [{ src: track.coverUrl, sizes: '512x512' }],
    });
    navigator.mediaSession.setActionHandler('nexttrack', onNext);
    navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    return () => {
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [track, onNext, onPrev]);

  if (!track) return null;

  // Swipe left/right on the player to skip on phones (RTL: swipe left = next)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null || Math.abs(end - start) < 60) return;
    if (end < start) onNext();
    else onPrev();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed bottom-16 sm:bottom-0 inset-x-0 z-40 transition-all duration-300 border-t backdrop-blur-xl ${
        isDark
          ? 'bg-[#0B0B0E]/95 border-white/10 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.8)]'
          : 'bg-white/95 border-black/10 text-black shadow-[0_-5px_25px_rgba(0,0,0,0.1)]'
      }`}
    >
      {/* Top micro progress bar */}
      <div className="w-full h-1 bg-white/10 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-200"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-6">
        {/* Track Info (Thumb + Title + Artist) */}
        <div
          onClick={onOpenDetails}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0 min-w-0 max-w-[160px] sm:max-w-xs"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-[#D4AF37]/30 shadow-md">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold truncate group-hover:text-[#D4AF37] transition-colors">
              {track.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 truncate">
              <span>{track.artist}</span>
              <span className="opacity-50">•</span>
              <span dir="ltr" className="font-mono text-[#D4AF37]">{track.code}</span>
            </div>
          </div>
        </div>

        {/* Center Controls & Waveform */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl px-2">
          {/* Waveform (Desktop & Tablet) */}
          <div className="w-full hidden md:block">
            <WaveformVisualizer
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
              theme={theme}
              height={32}
              barCount={36}
              trackId={track.id}
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onPrev}
              aria-label="العمل السابق"
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSkip(-10)}
              aria-label="تأخير 10 ثوانٍ"
              className="hidden sm:inline-flex p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-[-1px]" />
              )}
            </button>

            <button
              onClick={() => onSkip(10)}
              aria-label="تقديم 10 ثوانٍ"
              className="hidden sm:inline-flex p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onNext}
              aria-label="العمل التالي"
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time display */}
            <div className="text-[11px] font-mono text-gray-400 hidden sm:block mr-2">
              <span>{formatDuration(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="absolute bottom-full inset-x-0 bg-white/95 px-3 py-1 text-center text-[10px] text-red-600 shadow-sm sm:text-xs"
          >
            {error}
          </p>
        )}

        {/* Right CTA & Audio Settings */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Volume (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 accent-[#D4AF37] cursor-pointer"
              aria-label="التحكم بالصوت"
            />
          </div>

          {/* Quick Order Button */}
          <button
            onClick={onOrderClick}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black hover:opacity-95 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">اطلب هذه الزفة باسمك</span>
            <span className="sm:hidden">اطلب الآن</span>
          </button>

          {/* Close mini player */}
          <button
            onClick={onClose}
            aria-label="إغلاق المشغل"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
