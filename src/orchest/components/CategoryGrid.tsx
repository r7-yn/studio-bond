import React from "react";
import { ChevronLeft } from "lucide-react";
import { Category, CategoryId, ThemeMode } from "../types/index";

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  theme: ThemeMode;
  onViewAll: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  theme,
  onViewAll,
}) => {
  const isDark = theme === "dark";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>أقسامنا</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
            تصفح الأعمال المصنفة بدقة حسب المناسبة والذوق الصوتي
          </p>
        </div>

        <button
          onClick={onViewAll}
          className={`flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            isDark ? "text-[#D4AF37] hover:underline" : "text-[#B89728] hover:underline"
          }`}
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Categories matching Screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer border transition-all duration-300 ${
                isSelected
                  ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-[1.02]"
                  : isDark
                    ? "bg-[#16161C] border-white/10 hover:border-[#D4AF37]/50 hover:shadow-lg hover:shadow-black/40"
                    : "bg-white border-black/10 hover:border-[#B89728]/50 hover:shadow-md"
              }`}
            >
              {/* Image thumbnail with overlay */}
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${
                    isDark
                      ? "from-[#16161C] via-[#16161C]/50 to-transparent"
                      : "from-[#FFFFFF] via-[#FFFFFF]/50 to-transparent"
                  }`}
                />
              </div>

              {/* Text Meta */}
              <div className="p-3 text-center -mt-6 relative z-10">
                <h3 className="font-bold text-sm sm:text-base group-hover:text-[#D4AF37] transition-colors">
                  {cat.name}
                </h3>
                <span
                  className={`text-xs block mt-1 ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}
                >
                  {cat.count.toLocaleString()} عمل
                </span>
                {cat.slug && (
                  <a
                    href={`/category/${encodeURIComponent(cat.slug)}`}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2 inline-block text-xs font-semibold text-o-primary hover:underline"
                    aria-label={`عرض صفحة تصنيف ${cat.name}`}
                  >
                    استكشف التصنيف
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
