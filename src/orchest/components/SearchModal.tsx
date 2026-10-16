import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Sparkles, Bot, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Track, ThemeMode } from '../types/index';
import { filterTracks } from '../utils/trackLogic';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  theme: ThemeMode;
}

interface SemanticMatch {
  trackId: string;
  score: number;
  reason: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onSelectTrack,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [useSemantic, setUseSemantic] = useState(true);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<string>('');
  const [rhythmFilter, setRhythmFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<number | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSemanticMatches([]);
      setDetectedIntent('');
    }
  }, [isOpen]);

  // Handle semantic AI search query with debounce
  useEffect(() => {
    if (!useSemantic || !query.trim() || query.trim().length < 3) {
      setSemanticMatches([]);
      setDetectedIntent('');
      setIsSearchingAI(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      setIsSearchingAI(true);
      try {
        const res = await fetch('/api/ai/semantic-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, tracks }),
        });
        if (res.ok) {
          const data = await res.json();
          setSemanticMatches(data.matches || []);
          setDetectedIntent(data.intentSummary || '');
        }
      } catch (err) {
        console.error('Semantic search error:', err);
      } finally {
        setIsSearchingAI(false);
      }
    }, 450);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, useSemantic, tracks]);

  if (!isOpen) return null;

  // Determine display tracks: either semantic matches or traditional filtered tracks
  const standardResults = filterTracks(tracks, query);

  const rhythmOptions = Array.from(new Set(tracks.map((t) => t.rhythm)));
  const categoryOptions = Array.from(new Map(tracks.map((t) => [t.categoryId, t.categoryLabel])).entries());
  const matchesFilters = (t: Track) =>
    (rhythmFilter === 'all' || t.rhythm === rhythmFilter) && (categoryFilter === 'all' || t.categoryId === categoryFilter);

  const unfilteredTracks = useSemantic && semanticMatches.length > 0
    ? semanticMatches
        .map((m) => ({
          track: tracks.find((t) => t.id === m.trackId),
          score: m.score,
          reason: m.reason,
        }))
        .filter((item): item is { track: Track; score: number; reason: string } => Boolean(item.track))
    : standardResults.map((t) => ({ track: t, score: 0, reason: '' }));
  const finalTracks = unfilteredTracks.filter((item) => matchesFilters(item.track));
  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
      active ? 'bg-o-primary border-o-primary text-o-on-primary' : 'border-o-border text-o-muted hover:text-o-text'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden z-10 transition-all ${
          isDark ? 'bg-[#16161C] border-white/10 text-white' : 'bg-white border-black/10 text-black'
        }`}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث"
            placeholder="اكتب بالعامية أو الفصحى (مثال: أبي زفة هادية بدون موسيقى للعروس)..."
            className="w-full bg-transparent outline-none text-sm sm:text-base font-medium placeholder-gray-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSemanticMatches([]);
                setDetectedIntent('');
              }}
              className="text-xs text-gray-400 hover:text-white px-2"
            >
              مسح
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="إغلاق البحث"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick filters by category and rhythm */}
        <div className="px-4 py-2 border-b border-o-border space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="التصنيف">
            <button onClick={() => setCategoryFilter('all')} className={chip(categoryFilter === 'all')}>كل التصنيفات</button>
            {categoryOptions.map(([id, label]) => (
              <button key={id} onClick={() => setCategoryFilter(id)} className={chip(categoryFilter === id)}>{label}</button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="الإيقاع">
            <button onClick={() => setRhythmFilter('all')} className={chip(rhythmFilter === 'all')}>كل الإيقاعات</button>
            {rhythmOptions.map((r) => (
              <button key={r} onClick={() => setRhythmFilter(r)} className={chip(rhythmFilter === r)}>{r}</button>
            ))}
          </div>
        </div>

        {/* AI Semantic Search Mode Pill */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-[#D4AF37]/5 text-xs">
          <button
            onClick={() => setUseSemantic(!useSemantic)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              useSemantic
                ? 'bg-[#D4AF37] text-black shadow-xs'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>البحث الدلالي الذكي (Semantic AI)</span>
          </button>

          {isSearchingAI ? (
            <span className="flex items-center gap-1.5 text-[#D4AF37] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span>جاري تحليل طلبك...</span>
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">يفهم اللهجة والمشاعر بدون تطابق حرفي</span>
          )}
        </div>

        {/* Detected Intent Banner */}
        {detectedIntent && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center gap-2.5 text-xs">
            <Bot className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <span className="font-bold text-[#D4AF37]">النية المكتشفة: </span>
              <span className="text-gray-200">{detectedIntent}</span>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-white/5 p-2">
          {finalTracks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {isSearchingAI
                ? 'جاري البحث الذكي عن أقرب الأعمال...'
                : `لم نجد أي عمل يطابق "${query}". جرب وصف المناسبة مثل "زفة بدون موسيقى" أو "شيلة حماسية".`}
            </div>
          ) : (
            finalTracks.map(({ track, score, reason }) => (
              <div
                key={track.id}
                onClick={() => {
                  onSelectTrack(track);
                  onClose();
                }}
                className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#D4AF37]/20"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{track.title}</h4>
                      {score > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                          {Math.round(score)}% تطابق
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{track.artist}</span>
                      <span>•</span>
                      <span dir="ltr" className="font-mono text-[#D4AF37]">{track.code}</span>
                      <span>•</span>
                      <span>{track.rhythm}</span>
                    </div>

                    {reason && (
                      <p className="text-[11px] text-emerald-400 mt-1 line-clamp-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>{reason}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-gray-400">{track.durationFormatted}</span>
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors">
                    <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

