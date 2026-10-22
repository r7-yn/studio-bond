import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Check, X, Sparkles, FolderOpen } from 'lucide-react';
import { ThemeMode } from '../types/index';
import { PRESET_STUDIO_IMAGES, PresetImage } from '../data/mockData';

interface ImageUploaderProps {
  currentImage: string;
  onSelectImage: (url: string) => void;
  theme: ThemeMode;
  label?: string;
  recommendedAspect?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onSelectImage,
  theme,
  label = 'صورة الغلاف',
  recommendedAspect = 'موصى به: 800×800 أو 1200×800 بكسل',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  const handleFileProcess = (file: File) => {
    setUploadError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً. الحد الأقصى المسموح 5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onSelectImage(result);
        setSelectedPresetId(null);
      }
    };
    reader.onerror = () => {
      setUploadError('حدث خطأ أثناء قراءة الصورة');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = (preset: PresetImage) => {
    setSelectedPresetId(preset.id);
    onSelectImage(preset.url);
    setUploadError(null);
  };

  return (
    <div className="space-y-3">
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold block">{label}</label>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/20 dark:bg-white/5 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'upload'
                ? 'bg-[#D4AF37] text-black font-bold shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>رفع من جهازك</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'preset'
                ? 'bg-[#D4AF37] text-black font-bold shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>معرض الاستوديو</span>
          </button>
        </div>
      </div>

      {/* Active Preview */}
      {currentImage && (
        <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 p-2 bg-[#D4AF37]/5 flex items-center gap-3">
          <img
            src={currentImage}
            alt="معاينة الصورة"
            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-[#D4AF37] block flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>تم اختيار الصورة بنجاح</span>
            </span>
            <span className="text-[11px] text-gray-400 truncate block mt-0.5">
              {currentImage.startsWith('data:') ? 'صورة مرفوعة محلياً من جهازك' : 'صورة مختارة من الكتالوج'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectImage('');
              setSelectedPresetId(null);
            }}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs cursor-pointer"
            title="إزالة الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Local File Upload */}
      {activeTab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                : isDark
                ? 'border-white/15 hover:border-[#D4AF37]/50 bg-black/20 hover:bg-black/30'
                : 'border-black/15 hover:border-[#B89728]/50 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2">
              <FolderOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold mb-1">
              انقر لاختيار صورة من جهازك، أو اسحب الملف هنا
            </p>
            <p className="text-[11px] text-gray-400">
              يدعم PNG, JPG, WebP حتى 5 ميجابايت • {recommendedAspect}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Preset Studio Library Gallery */}
      {activeTab === 'preset' && (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400">
            اختر من مكتبة الاستوديو الفاخرة للزفات والشيلات:
          </p>
          <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 rounded-xl border border-white/5 bg-black/20">
            {PRESET_STUDIO_IMAGES.map((preset) => {
              const isSelected = selectedPresetId === preset.id || currentImage === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-95'
                      : 'border-transparent hover:border-white/30 opacity-80 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#D4AF37]/30 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white py-0.5 px-1 truncate text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
      )}
    </div>
  );
};
