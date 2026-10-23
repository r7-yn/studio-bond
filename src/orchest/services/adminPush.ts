import { adminHeaders } from "../utils/adminAuth";

interface PushConfigResponse {
  configured: boolean;
  publicKey: string | null;
}

async function readError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ الإشعارات";
}

export async function getAdminPushConfig(): Promise<PushConfigResponse> {
  const response = await fetch("/api/admin/push/config", { credentials: "include" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PushConfigResponse;
}

export async function saveAdminPushSubscription(
  csrfToken: string,
  subscription: PushSubscription,
): Promise<void> {
  const json = subscription.toJSON();
  const response = await fetch("/api/admin/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function removeAdminPushSubscription(
  csrfToken: string,
  endpoint: string,
): Promise<void> {
  const response = await fetch("/api/admin/push/unsubscribe", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: JSON.stringify({ endpoint }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function sendAdminPushTest(
  csrfToken: string,
): Promise<{ sent: number; removed: number }> {
  const response = await fetch("/api/admin/push/test", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as { sent: number; removed: number };
}
