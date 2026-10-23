import React, { useState } from "react";
import { LockKeyhole, LogIn, X } from "lucide-react";
import type { ThemeMode } from "../types/index";

interface AdminLoginProps {
  theme: ThemeMode;
  onAuthenticated: () => void;
  onCancel: () => void;
}

export function AdminLogin({ theme, onAuthenticated, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === "dark";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "تعذر تسجيل الدخول حالياً";
        throw new Error(message);
      }
      setPassword("");
      onAuthenticated();
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : "تعذر تسجيل الدخول حالياً");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="min-h-[60vh] flex items-center justify-center px-4 py-16"
      aria-labelledby="admin-login-title"
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl ${isDark ? "bg-[#16161C] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
      >
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-4">
              <LockKeyhole className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 id="admin-login-title" className="text-2xl font-bold">
              دخول لوحة التحكم
            </h1>
            <p className="mt-2 text-sm text-gray-400">سجّل الدخول بحساب المدير في Supabase Auth.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق تسجيل الدخول"
            className="p-2 rounded-xl text-gray-400 hover:bg-white/10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none ${isDark ? "bg-black/30 border-white/10 text-white focus:border-[#D4AF37]" : "bg-gray-50 border-black/10 text-black focus:border-[#B89728]"}`}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold mb-2">
              كلمة مرور حساب Supabase
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none ${isDark ? "bg-black/30 border-white/10 text-white focus:border-[#D4AF37]" : "bg-gray-50 border-black/10 text-black focus:border-[#B89728]"}`}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || email.trim().length === 0 || password.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" aria-hidden="true" />
            {isSubmitting ? "جارٍ التحقق من Supabase…" : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </section>
  );
}
