import React, { useMemo } from "react";

interface WaveformPreviewProps {
  trackId: string;
  theme: "dark" | "light";
}

/** Decorative, deterministic waveform preview; it does not claim to decode the audio file. */
export const WaveformPreview: React.FC<WaveformPreviewProps> = ({ trackId, theme }) => {
  const bars = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < trackId.length; i += 1) {
      seed = (seed + trackId.charCodeAt(i) * (i + 1)) % 100_003;
    }
    return Array.from({ length: 36 }, (_, index) => {
      const x = index / 35;
      const envelope = 0.24 + Math.sin(x * Math.PI) * 0.68;
      const noise = ((seed * (index + 23) * 9301 + 49297) % 233_280) / 233_280;
      return Math.max(0.18, Math.min(1, envelope * (0.55 + noise * 0.45)));
    });
  }, [trackId]);

  return (
    <div
      className="mt-3 flex h-7 items-center gap-[2px] overflow-hidden"
      role="img"
      aria-label="معاينة موجية بصرية توضيحية للتسجيل"
    >
      {bars.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-full"
          style={{
            height: `${Math.max(4, Math.round(height * 25))}px`,
            backgroundColor: theme === "dark" ? "rgba(212,175,55,0.75)" : "rgba(184,151,40,0.78)",
          }}
        />
      ))}
      <span className="sr-only">شكل الموجة زخرفي ولا يمثل تحليل الملف الصوتي.</span>
    </div>
  );
};
