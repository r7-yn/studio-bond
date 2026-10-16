import React, { useMemo } from 'react';
import { ThemeMode } from '../types/index';

interface WaveformVisualizerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  theme: ThemeMode;
  barCount?: number;
  height?: number;
  trackId?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  currentTime,
  duration,
  isPlaying,
  onSeek,
  theme,
  barCount = 48,
  height = 48,
  trackId = 'default',
}) => {
  // Generate consistent pseudo-random height profiles per track
  const bars = useMemo(() => {
    const list: number[] = [];
    let seed = 0;
    for (let i = 0; i < trackId.length; i++) {
      seed = (seed + trackId.charCodeAt(i) * (i + 1)) % 1000;
    }
    for (let i = 0; i < barCount; i++) {
      // Create natural acoustic envelope (rise, peak, dynamic peaks, descent)
      const x = i / barCount;
      const envelope = Math.sin(x * Math.PI) * 0.5 + 0.5;
      const pseudoRand = ((seed * (i + 13) * 9301 + 49297) % 233280) / 233280;
      const h = Math.max(0.18, Math.min(0.98, envelope * (0.35 + pseudoRand * 0.65)));
      list.push(h);
    }
    return list;
  }, [trackId, barCount]);

  const progress = duration > 0 ? currentTime / duration : 0;
  const activeIndex = Math.floor(progress * barCount);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isRtl = document.dir === 'rtl';
    const clickX = e.clientX - rect.left;
    // In RTL, 0 progress starts from the right!
    const ratio = isRtl ? (rect.width - clickX) / rect.width : clickX / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    onSeek(clamped * duration);
  };

  const isDark = theme === 'dark';
  const activeColor = isDark ? '#D4AF37' : '#B89728';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between gap-[2px] sm:gap-[3px] w-full cursor-pointer py-2 group select-none"
      style={{ height }}
      role="slider"
      aria-label="موجات الصوت وشريط التقدم"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
      }}
    >
      {bars.map((barHeight, idx) => {
        const isActive = idx <= activeIndex;
        // subtle pulse animation when playing
        const pulse = isPlaying && isActive ? (idx % 3 === 0 ? 1.15 : 0.95) : 1;
        const currentH = Math.max(4, Math.round(barHeight * height * pulse));

        return (
          <div
            key={idx}
            className="flex-1 rounded-full transition-all duration-150 group-hover:opacity-90"
            style={{
              height: `${currentH}px`,
              backgroundColor: isActive ? activeColor : inactiveColor,
              boxShadow: isActive && isDark ? '0 0 6px rgba(212, 175, 55, 0.35)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
