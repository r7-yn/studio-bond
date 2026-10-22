import { adminHeaders } from "../utils/adminAuth";

export type MediaKind = "image" | "audio";

interface SignedUploadResponse {
  signedUrl: string;
  publicUrl: string;
}

export async function uploadMediaFile(
  file: File,
  csrfToken: string,
  kind: MediaKind,
  onProgress: (progress: number) => void,
): Promise<string> {
  const signedResponse = await fetch("/api/admin/media-upload-url", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    }),
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });

  const signedResult: unknown = await signedResponse.json().catch(() => null);
  if (!signedResponse.ok || !signedResult || typeof signedResult !== "object") {
    const message =
      signedResult && typeof signedResult === "object" && "error" in signedResult
        ? String(signedResult.error)
        : "تعذر تجهيز رابط رفع الملف.";
    throw new Error(message);
  }

  const { signedUrl, publicUrl } = signedResult as SignedUploadResponse;
  if (!signedUrl || !publicUrl) throw new Error("رابط الرفع غير صالح.");

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl);
    request.timeout = 180_000;
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("cache-control", "max-age=31536000");
    request.setRequestHeader("x-upsert", "false");
    const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (publishableKey) request.setRequestHeader("apikey", publishableKey);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(publicUrl);
      } else {
        reject(new Error("تعذر رفع الملف إلى مساحة التخزين. حاول مرة أخرى."));
      }
    };
    request.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الملف."));
    request.ontimeout = () => reject(new Error("انتهت مهلة رفع الملف. حاول مرة أخرى."));
    request.onabort = () => reject(new Error("تم إلغاء رفع الملف."));
    request.send(file);
  });
}
