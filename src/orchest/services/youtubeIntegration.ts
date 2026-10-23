import { adminHeaders } from "../utils/adminAuth";

export interface YouTubeConnection {
  channel_id: string;
  channel_title: string;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface YouTubeStatusResponse {
  configured: boolean;
  connection: YouTubeConnection | null;
}

async function readError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ تكامل YouTube";
}

export async function getYouTubeStatus(): Promise<YouTubeStatusResponse> {
  const response = await fetch("/api/admin/youtube/status", { credentials: "include" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as YouTubeStatusResponse;
}

export async function startYouTubeConnect(csrfToken: string): Promise<string> {
  const response = await fetch("/api/admin/youtube/connect", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { authorizeUrl?: string };
  if (!payload.authorizeUrl) throw new Error("لم يصل رابط موافقة YouTube");
  return payload.authorizeUrl;
}

export async function syncYouTube(
  csrfToken: string,
): Promise<{ imported: number; requiresReview: number; channelTitle: string }> {
  const response = await fetch("/api/admin/youtube/sync", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as {
    imported: number;
    requiresReview: number;
    channelTitle: string;
  };
}
