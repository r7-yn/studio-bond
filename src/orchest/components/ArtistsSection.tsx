import React from 'react';
import { CheckCircle2, ChevronLeft, Music2, Sparkles, ArrowLeft } from 'lucide-react';
import { Artist, ThemeMode } from '../types/index';

interface ArtistsSectionProps {
  artists: Artist[];
  onSelectArtist: (artist: Artist) => void;
  theme: ThemeMode;
  onViewAll?: () => void;
  isStandalone?: boolean;
}

export const ArtistsSection: React.FC<ArtistsSectionProps> = ({
  artists,
  onSelectArtist,
  theme,
  onViewAll,
  isStandalone = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <section className={`py-12 ${isStandalone ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'border-t border-white/5'}`}>
      <div className={`${isStandalone ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                نخبة الأصوات الخليجية
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>فنانو ومنشدو أوركست</span>
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              أصوات ملكية نادرة وخامات صوتية حصرية تصدح بأعذب الزفات والشيلات. انقر على أي فنان لاستعراض أعماله وتنفيذ طلبك بصوته.
            </p>
          </div>

          {onViewAll && !isStandalone && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer transition-all self-end"
            >
              <span>عرض جميع الفنانين ({artists.length})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist(artist)}
              className={`group relative rounded-3xl p-5 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                isDark
                  ? 'bg-gradient-to-b from-[#16161C] to-[#121217] border-white/10 hover:border-[#D4AF37]/60 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]'
                  : 'bg-white border-black/10 hover:border-[#B89728]/60 hover:shadow-xl'
              } hover:-translate-y-1.5`}
            >
              {/* Subtle Golden Glow in Background */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl group-hover:bg-[#D4AF37]/20 transition-all pointer-events-none" />

              <div>
                {/* Artist Photo with Golden Ring */}
                <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-transparent p-0.5 group-hover:rotate-45 transition-transform duration-700">
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover border-2 border-[#16161C]"
                    />
                  </div>

                  {artist.isVerified && (
                    <div
                      className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-md"
                      title="فنان معتمد وحصري في أوركست"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Name & Role */}
                <div className="text-center">
                  <h3 className="font-bold text-base sm:text-lg group-hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1.5">
                    <span>{artist.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {artist.role}
                  </p>
                </div>

                {/* Genre Tags */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                  {artist.genres.slice(0, 2).map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Bio snippet */}
                <p className="text-[11px] text-gray-400 text-center line-clamp-2 mt-3 leading-relaxed px-1">
                  {artist.bio}
                </p>
              </div>

              {/* Card Footer: Metrics & Action */}
              <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Music2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{artist.tracksCount ?? 0} عمل</span>
                  </span>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#D4AF37] group-hover:text-black flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
