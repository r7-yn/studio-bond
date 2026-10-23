import { supabase } from "@/integrations/supabase/client";
import type { GiftDeliveryRow } from "../types/index";
import { adminHeaders } from "../utils/adminAuth";

export interface GiftTokenResult {
  delivery: GiftDeliveryRow;
  token: string;
  giftPath: string;
}

async function adminRequest<T>(
  path: string,
  csrfToken: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "تعذر إتمام طلب التسليم.";
    throw new Error(message);
  }
  return payload as T;
}

export async function listGiftDeliveries(csrfToken: string): Promise<GiftDeliveryRow[]> {
  const payload = await adminRequest<{ deliveries?: GiftDeliveryRow[] }>(
    "/api/admin/gifts/list",
    csrfToken,
    {},
  );
  return payload.deliveries ?? [];
}

export async function uploadGiftAudio(file: File, csrfToken: string): Promise<string> {
  const upload = await adminRequest<{ path: string; token: string }>(
    "/api/admin/gifts/upload-url",
    csrfToken,
    { contentType: file.type, size: file.size },
  );
  const { error } = await supabase.storage
    .from("orchest-gifts")
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("تعذر رفع الملف إلى مساحة التسليم الخاصة.");
  return upload.path;
}

export function createGiftDelivery(
  csrfToken: string,
  input: {
    title: string;
    occasionType: string;
    recipientName: string;
    recipientPhone: string;
    greeting: string;
    storagePath: string;
  },
): Promise<GiftTokenResult> {
  return adminRequest<GiftTokenResult>("/api/admin/gifts", csrfToken, input);
}

export function rotateGiftDelivery(csrfToken: string, id: string): Promise<GiftTokenResult> {
  return adminRequest<GiftTokenResult>("/api/admin/gifts/rotate", csrfToken, { id });
}

export async function revokeGiftDelivery(csrfToken: string, id: string): Promise<void> {
  await adminRequest<{ ok: boolean }>("/api/admin/gifts/revoke", csrfToken, { id });
}
