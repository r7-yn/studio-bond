import { adminHeaders } from "../utils/adminAuth";

export interface AdminAssistantResponse {
  answer: string;
  evidenceRefs: string[];
  confidence: number;
  needsReview: boolean;
}

export async function askAdminAssistant(
  csrfToken: string,
  message: string,
): Promise<AdminAssistantResponse> {
  const response = await fetch("/api/admin/assistant", {
    method: "POST",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json", "X-CSRF-Token": csrfToken }),
    body: JSON.stringify({ message }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "تعذر تشغيل المساعد";
    throw new Error(error);
  }
  return payload as AdminAssistantResponse;
}
