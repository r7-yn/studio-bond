import React, { useState, useRef } from "react";
import { Upload, Check, X, FolderOpen } from "lucide-react";
import { ThemeMode } from "../types/index";
import { uploadMediaFile } from "../services/mediaUpload";

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxBytes = 900 * 1024;
  const dimensions = [1280, 1024, 800];
  const qualities = [0.82, 0.72, 0.62];

  for (const maxDimension of dimensions) {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذر تجهيز الصورة للضغط.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= maxBytes) {
        bitmap.close();
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    }
  }

  bitmap.close();
  throw new Error("تعذر ضغط الصورة إلى الحجم المطلوب. اختر صورة أصغر.");
}

interface ImageUploaderProps {
  currentImage: string;
  onSelectImage: (url: string) => void;
  theme: ThemeMode;
  csrfToken: string;
  label?: string;
  recommendedAspect?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onSelectImage,
  theme,
  csrfToken,
  label = "صورة الغلاف",
  recommendedAspect = "موصى به: 800×800 أو 1200×800 بكسل",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const handleFileProcess = async (file: File) => {
    setUploadError(null);

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("حجم الصورة كبير جداً. الحد الأقصى المسموح 5 ميجابايت.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setRetryFile(file);
    try {
      const compressed = await compressImage(file);
      setRetryFile(compressed);
      const url = await uploadMediaFile(compressed, csrfToken, "image", setUploadProgress);
      onSelectImage(url);
      setRetryFile(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "تعذر رفع الصورة. حاول مرة أخرى.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold block">{label}</label>
        <span className="text-[11px] text-gray-400">ارفع صورة حقيقية من جهازك</span>
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
              {currentImage.startsWith("data:")
                ? "صورة قديمة مضمنة في قاعدة البيانات"
                : currentImage.startsWith("http")
                  ? "رابط صورة محفوظ في التخزين أو الكتالوج"
                  : "صورة مختارة من الكتالوج"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectImage("");
            }}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs cursor-pointer"
            title="إزالة الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentImage.startsWith("data:image/") && (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => {
            void fetch(currentImage)
              .then((response) => response.blob())
              .then((blob) =>
                handleFileProcess(
                  new File([blob], "legacy-image", { type: blob.type || "image/jpeg" }),
                ),
              )
              .catch(() => setUploadError("تعذر قراءة الصورة القديمة لتحويلها إلى التخزين."));
          }}
          className="w-full rounded-lg border border-amber-400/30 px-3 py-2 text-[11px] font-semibold text-amber-500 disabled:opacity-50"
        >
          ضغط ونقل الصورة القديمة إلى التخزين
        </button>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              void handleFileProcess(e.target.files[0]);
            }
            e.target.value = "";
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 ${
            isUploading ? "cursor-wait opacity-70" : "cursor-pointer"
          } ${
            isDragging
              ? "border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]"
              : isDark
                ? "border-white/15 hover:border-[#D4AF37]/50 bg-black/20 hover:bg-black/30"
                : "border-black/15 hover:border-[#B89728]/50 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2">
            <FolderOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold mb-1">انقر لاختيار صورة من جهازك، أو اسحب الملف هنا</p>
          <p className="text-[11px] text-gray-400">
            يدعم PNG, JPG, WebP حتى 5 ميجابايت • تُضغط الصورة تلقائياً قبل رفعها •{" "}
            {recommendedAspect}
          </p>
        </div>
        {isUploading && (
          <div className="mt-2 space-y-1" role="status" aria-live="polite">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>ضغط الصورة ورفعها إلى التخزين</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#D4AF37] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center justify-between gap-2" role="alert">
          <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
          {retryFile && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => void handleFileProcess(retryFile)}
              className="shrink-0 rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 disabled:opacity-50"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}
    </div>
  );
};
