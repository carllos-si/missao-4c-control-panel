"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Falha ao conectar. Verifique as variáveis do Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom flex min-h-screen flex-col justify-center px-4">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-accent/20 bg-navy-card p-6 shadow-lg">
        <h1 className="text-center text-xl font-bold text-mist">Missão 4C</h1>
        <p className="mt-1 text-center text-sm text-mist/65">Acesso do facilitador</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-mist/80">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2.5 text-sm text-mist outline-none ring-accent/40 placeholder:text-mist/35 focus:border-accent/50 focus:ring-2"
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-mist/80">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2.5 text-sm text-mist outline-none ring-accent/40 focus:border-accent/50 focus:ring-2"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-200">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-navy transition hover:bg-accent-dim disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-mist/55">
          Novo facilitador?{" "}
          <Link href="/cadastro" className="text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
