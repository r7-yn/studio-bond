import React, { useState } from 'react';
import { 
  ChevronRight, 
  CheckCircle2, 
  Music2, 
  Sparkles, 
  MessageCircle, 
  Play, 
  Pause, 
  Heart, 
  Share2,
  Clock,
  Mic2
} from 'lucide-react';
import { Artist, Track, ThemeMode, RhythmType } from '../types/index';
import { TrackCard } from './TrackCard';

interface ArtistDetailsViewProps {
  artist: Artist;
  tracks: Track[];
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: (track: Track) => void;
  onOrderTrack: (track: Track) => void;
  activeTrackId: string | null;
  isPlaying: boolean;
  theme: ThemeMode;
  favorites: string[];
  onToggleFavorite: (trackId: string) => void;
  whatsappNumber: string;
}

export const ArtistDetailsView: React.FC<ArtistDetailsViewProps> = ({
  artist,
  tracks,
  onBack,
  onSelectTrack,
  onTogglePlay,
  onOrderTrack,
  activeTrackId,
  isPlaying,
  theme,
  favorites,
  onToggleFavorite,
  whatsappNumber,
}) => {
  const [selectedRhythm, setSelectedRhythm] = useState<string>('all');

  const isDark = theme === 'dark';

  // Filter tracks by this artist
  const artistTracks = tracks.filter(
    (t) =>
      t.artist.includes(artist.name) ||
      artist.name.includes(t.artist)
  );

  // If strict match has very few, also show related works by genre
  const displayTracks = artistTracks.length > 0 
    ? artistTracks 
    : tracks.slice(0, 4);

  const filteredTracks = selectedRhythm === 'all'
    ? displayTracks
    : displayTracks.filter((t) => t.rhythm === selectedRhythm);

  return (
    <div className="animate-fade-in pb-16">
      {/* 1. Artist Hero Banner */}
      <div className="relative overflow-hidden border-b border-white/10">
        {/* Cover Background with Blur */}
        <div className="absolute inset-0 z-0">
          <img
            src={artist.coverImage || artist.avatar}
            alt={artist.name}
            className="w-full h-full object-cover opacity-20 blur-xl scale-105"
          />
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-[#0B0B0E]/80 via-[#0B0B0E]/95 to-[#0B0B0E]' : 'bg-gradient-to-b from-white/80 via-white/95 to-[#F9F9FB]'}`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Breadcrumb Back Button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white mb-6 cursor-pointer border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
            <span>العودة لجميع الفنانين والأعمال</span>
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Large Artist Portrait */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#997B20] shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-full h-full rounded-full object-cover border-4 border-[#0B0B0E]"
                />
              </div>
              {artist.isVerified && (
                <div
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-lg"
                  title="منشد معتمد وحصري"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex-1 text-center md:text-right">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1">
                  <Mic2 className="w-3.5 h-3.5" />
                  <span>{artist.role}</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
                  استوديو أوركست الحصري
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
                {artist.name}
              </h1>

              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed mb-6">
                {artist.bio}
              </p>

              {/* Stats & Genres */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4 border-t border-white/10 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-white font-mono">{displayTracks.length}</span>
                  <span className="text-gray-400">عمل صوتي متاح</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {artist.genres.map((g, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-gray-300">
                      #{g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Artist Booking CTA */}
            <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const first = displayTracks[0];
                  if (first) onOrderTrack(first);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold text-sm shadow-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>طلب عمل مخصص بصوت {artist.name}</span>
              </button>

              <button
                onClick={() => {
                  const first = displayTracks[0];
                  if (first) onTogglePlay(first);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تشغيل أعمال الفنان</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tracks Filter & Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>جميع الأعمال بصوت الفنان {artist.name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                {filteredTracks.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              استمع إلى نماذج الأعمال الماسترينغ، واطلب تنفيذها بالأسماء أو التعديل المناسب
            </p>
          </div>

          {/* Rhythm Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 dark:bg-white/5 border border-white/10 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'بدون موسيقى', label: 'بدون موسيقى' },
              { id: 'دفوف', label: 'دفوف' },
              { id: 'أوركسترا', label: 'أوركسترا' },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setSelectedRhythm(rf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRhythm === rf.id
                    ? 'bg-[#D4AF37] text-black shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks Grid */}
        {filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTracks.map((tr) => (
              <TrackCard
                key={tr.id}
                track={tr}
                isPlaying={isPlaying && activeTrackId === tr.id}
                onTogglePlay={(e) => {
                  e.stopPropagation();
                  onTogglePlay(tr);
                }}
                onOrderClick={(e) => {
                  e.stopPropagation();
                  onOrderTrack(tr);
                }}
                onOpenDetails={() => onSelectTrack(tr)}
                isFavorite={favorites.includes(tr.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(tr.id);
                }}
                theme={theme}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-8">
            <Music2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-300">لا توجد أعمال بهذا الإيقاع حالياً</h3>
            <p className="text-xs text-gray-500 mt-1">
              يمكنك طلب تنفيذ أي قصيدة أو زفة بهذا الإيقاع حصرياً بصوت {artist.name} عبر الواتساب
            </p>
            <button
              onClick={() => {
                if (displayTracks[0]) onOrderTrack(displayTracks[0]);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>طلب تنفيذ زفة خاصة بالأسماء</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
