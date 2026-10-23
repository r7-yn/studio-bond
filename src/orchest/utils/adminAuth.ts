const LEGACY_KEY = "orchest_admin_session";

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  clearAdminToken();
  return extra;
}
