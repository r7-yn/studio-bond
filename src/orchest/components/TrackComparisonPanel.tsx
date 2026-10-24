import React, { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import type { Track } from "../types/index";

interface TrackComparisonPanelProps {
  tracks: Track[];
  onRemove: (trackId: string) => void;
  onStartTrack: (track: Track) => void;
  onPause: () => void;
}

type ComparisonPhase = "idle" | "first" | "second" | "done";

export const TrackComparisonPanel: React.FC<TrackComparisonPanelProps> = ({
  tracks,
  onRemove,
  onStartTrack,
  onPause,
}) => {
  const [phase, setPhase] = useState<ComparisonPhase>("idle");
  const [remaining, setRemaining] = useState(30);
  const tracksRef = useRef(tracks);
  const callbacksRef = useRef({ onStartTrack, onPause });
  tracksRef.current = tracks;
  callbacksRef.current = { onStartTrack, onPause };

  useEffect(() => {
    if (phase !== "first" && phase !== "second") return;
    const startedAt = Date.now();
    setRemaining(30);
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const secondsLeft = Math.max(0, 30 - elapsed);
      setRemaining(secondsLeft);
      if (elapsed < 30) return;
      window.clearInterval(interval);
      if (phase === "first") {
        const second = tracksRef.current[1];
        if (!second) {
          callbacksRef.current.onPause();
          setPhase("done");
          return;
        }
        callbacksRef.current.onStartTrack(second);
        setPhase("second");
      } else {
        callbacksRef.current.onPause();
        setPhase("done");
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [phase]);

  if (tracks.length === 0) return null;
  const canStart = tracks.length === 2 && tracks.every((track) => Boolean(track.audioUrl));
  const start = () => {
    if (!canStart) return;
    setRemaining(30);
    setPhase("first");
    onStartTrack(tracks[0]!);
  };
  const stop = () => {
    onPause();
    setPhase("idle");
    setRemaining(30);
  };
  const currentLabel = phase === "first" ? tracks[0]?.title : tracks[1]?.title;

  return (
    <aside
      dir="rtl"
      aria-label="مقارنة عملين صوتيين"
      className="fixed right-3 top-24 z-[45] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-o-primary/40 bg-o-surface/95 p-4 text-o-text shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold">
          <ArrowLeftRight className="h-4 w-4 text-o-primary" aria-hidden="true" />
          <span>مقارنة الأعمال ({tracks.length}/2)</span>
        </div>
        {tracks.length === 2 && (
          <button
            type="button"
            onClick={() => onRemove(tracks[1]!.id)}
            aria-label="إزالة العمل الثاني"
            className="rounded-lg p-1 text-o-muted hover:bg-o-surface-hover"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {tracks.map((track, index) => (
          <li key={track.id} className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs text-o-muted">{index + 1}.</span>
            <span className="truncate font-semibold">{track.title}</span>
          </li>
        ))}
        {tracks.length === 1 && (
          <li className="text-xs text-o-muted">اختر عملاً ثانياً لإجراء المقارنة.</li>
        )}
      </ul>
      {phase === "first" || phase === "second" ? (
        <div className="mt-3 rounded-lg bg-o-bg p-2 text-xs" aria-live="polite">
          <p>
            الاستماع إلى {phase === "first" ? "العمل الأول" : "العمل الثاني"}: {currentLabel}
          </p>
          <p className="mt-1 font-bold text-o-primary">متبقٍ {remaining} ثانية</p>
        </div>
      ) : phase === "done" ? (
        <p className="mt-3 text-xs text-o-muted" aria-live="polite">
          انتهت المقارنة: 30 ثانية لكل عمل.
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {phase === "first" || phase === "second" ? (
          <button
            type="button"
            onClick={stop}
            className="min-h-10 flex-1 rounded-lg border border-o-border px-3 text-sm font-semibold"
          >
            إيقاف المقارنة
          </button>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            onClick={start}
            className="min-h-10 flex-1 rounded-lg bg-o-primary px-3 text-sm font-bold text-o-on-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "done" ? "إعادة المقارنة" : "ابدأ المقارنة"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            stop();
            tracks.forEach((track) => onRemove(track.id));
          }}
          className="min-h-10 rounded-lg border border-o-border px-3 text-sm font-semibold"
        >
          إغلاق
        </button>
      </div>
      {!canStart && (
        <p className="mt-2 text-[11px] text-o-muted">تتطلب المقارنة وجود ملف صوتي متاح للعملين.</p>
      )}
    </aside>
  );
};
