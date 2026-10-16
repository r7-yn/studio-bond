// Backup copy of the signed admin session, used when the browser blocks the
// cookie (e.g. the site shown inside another page). The server still verifies the signature + expiry.
const KEY = 'orchest_admin_session';

export function saveAdminToken(token: unknown): void {
  try {
    if (typeof token === 'string' && token) localStorage.setItem(KEY, token);
  } catch { /* storage unavailable */ }
}

export function clearAdminToken(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem(KEY); } catch { /* ignore */ }
  return token ? { ...extra, 'X-Admin-Session': token } : extra;
}
