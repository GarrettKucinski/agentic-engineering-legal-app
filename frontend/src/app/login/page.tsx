"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";
import { setToken, isAuthenticated } from "@/lib/auth";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const fn = tab === "login" ? login : register;
      const { token, user_id } = await fn(email, password);
      setToken(token, user_id);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafc" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#032147" }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ecad0a" }}>
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">LegalDraft</span>
          </div>

          <div className="max-w-xs">
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              AI-powered legal documents, ready in minutes.
            </h2>
            <p style={{ color: "#7ea8c9" }} className="text-sm leading-relaxed">
              Generate professionally drafted legal agreements tailored to your needs. Start a conversation with our AI and get a ready-to-review document.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "12 professional document templates" },
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "AI-guided field collection" },
            { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Secure, private, and yours" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(32,157,215,0.2)" }}>
                <svg className="h-3 w-3" style={{ color: "#209dd7" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "#7ea8c9" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#032147" }}>
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "#032147" }}>LegalDraft</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {tab === "login"
                ? "Sign in to access your documents."
                : "Get started with LegalDraft today."}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className="flex-1 py-3.5 text-sm font-medium transition-colors relative"
                  style={{
                    color: tab === t ? "#209dd7" : "#888888",
                  }}
                >
                  {t === "login" ? "Sign In" : "Create Account"}
                  {tab === t && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: "#209dd7" }}
                    />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                  style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                />
                {tab === "register" && (
                  <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
                )}
              </div>

              {tab === "register" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5">
                  <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-1"
                style={{ backgroundColor: "#753991" }}
              >
                {loading
                  ? "Please wait…"
                  : tab === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>
          </div>

          <p className="text-xs text-center text-gray-400 mt-6">
            By signing in, you agree that all generated documents are drafts
            and require review by a qualified legal professional.
          </p>
        </div>
      </div>
    </div>
  );
}
