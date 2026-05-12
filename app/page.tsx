"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async () => {
    setError("");
    setIsSubmitting(true);

    if (mode === "register") {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: normalizedEmail,
        });
      }

      alert("Sign up successful. Now login.");
      setMode("login");
      setEmail(normalizedEmail);
      setIsSubmitting(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/board");
  };

  return (
    <main className="min-h-screen px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(110,168,146,0.16),transparent_32%)]" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800">
                Personal workflow hub
              </span>

              <div className="max-w-xl space-y-4">
                <h1 className="text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
                  TaskFlow keeps the messy part off your mind.
                </h1>
                <p className="text-base leading-7 text-stone-600 sm:text-lg">
                  Plan the day, drag work across lanes, and keep deadlines in view
                  without losing the calm.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="soft-card rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Focus
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  Move from ideas to done with a board that stays lightweight.
                </p>
              </div>
              <div className="soft-card rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Clarity
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  Deadlines stay visible, so urgent work rises without chaos.
                </p>
              </div>
              <div className="soft-card rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Ownership
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  Every login loads the right board for the right teammate.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel flex items-center rounded-[2rem] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
                {mode === "login" ? "Welcome back" : "Create your space"}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
                {mode === "login" ? "Sign in to your board" : "Start using TaskFlow"}
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                {mode === "login"
                  ? "Pick up where you left off and keep your board in motion."
                  : "Create an account and your personal workspace will be ready."}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Email</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Password</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button
                className="w-full rounded-2xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleAuth}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Sign Up"}
              </button>

              <button
                className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
                onClick={() =>
                  setMode(mode === "login" ? "register" : "login")
                }
              >
                {mode === "login"
                  ? "Need an account? Sign up"
                  : "Already registered? Login"}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
