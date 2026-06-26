"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        name: mode === "signup" ? name : undefined,
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Authentication failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/25">
              S2
            </div>
            <span className="text-lg font-display font-bold text-text-primary">
              Signal2Fix
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {mode === "signup"
              ? "Start turning noise into execution-ready work."
              : "Sign in to continue to the dashboard."}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border mb-6">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {m === "signup" ? "Create Account" : "Sign In"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-text-secondary mb-1.5" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-warn bg-warn/5 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading || !email.includes("@")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Signing in…"
              : mode === "signup"
                ? "Create Account →"
                : "Sign In →"}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-base px-2 text-text-muted">or continue with</span>
          </div>
        </div>

        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm font-medium hover:bg-elevated/50 hover:border-primary/20 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
          </svg>
          GitHub
        </button>

        <p className="text-xs text-text-muted text-center mt-6">
          {mode === "signup" ? (
            <>Already have an account?{" "}<button onClick={() => setMode("signin")} className="text-primary hover:underline">Sign in</button></>
          ) : (
            <>First time?{" "}<button onClick={() => setMode("signup")} className="text-primary hover:underline">Create an account</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}
