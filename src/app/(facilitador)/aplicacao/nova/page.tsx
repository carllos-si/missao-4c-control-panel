"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Participant } from "@/types/database";

function buildParticipants(n: number): Participant[] {
  return Array.from({ length: n }, (_, i) => ({
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${i}-${Date.now()}`,
    name: `Participante ${i + 1}`,
    observations: "",
  }));
}

export default function NovaAplicacaoPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [count, setCount] = useState(4);
  const [appliedAt, setAppliedAt] = useState(() => {
    const d = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => buildParticipants(Math.min(50, Math.max(1, count))), [count]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Math.min(50, Math.max(1, count));
    if (!companyName.trim()) {
      setError("Informe o nome da empresa ou cliente.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sessão expirada. Entre novamente.");
        return;
      }
      const participants = buildParticipants(n);
      const iso = new Date(appliedAt).toISOString();
      const { data, error: insErr } = await supabase
        .from("application_records")
        .insert({
          user_id: user.id,
          company_name: companyName.trim(),
          applied_at: iso,
          participant_count: n,
          participants,
        })
        .select("id")
        .single();
      if (insErr) {
        setError(insErr.message);
        return;
      }
      router.push(`/aplicacao/${data.id}`);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Verifique o Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-xs text-accent hover:underline">
          ← Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-mist">Nova aplicação</h1>
        <p className="text-sm text-mist/65">Configure empresa, data e participantes</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6 rounded-2xl border border-mist/10 bg-navy-card p-5">
        <div>
          <label htmlFor="company" className="block text-xs font-medium text-mist/80">
            Nome da empresa / cliente
          </label>
          <input
            id="company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2.5 text-sm text-mist outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/30"
            placeholder="Ex.: ACME Brasil"
          />
        </div>
        <div>
          <label htmlFor="applied" className="block text-xs font-medium text-mist/80">
            Data e hora da aplicação
          </label>
          <input
            id="applied"
            type="datetime-local"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2.5 text-sm text-mist outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div>
          <label htmlFor="count" className="block text-xs font-medium text-mist/80">
            Quantidade de participantes (1–50)
          </label>
          <input
            id="count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2.5 text-sm text-mist outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/30"
          />
          <p className="mt-2 text-xs text-mist/50">
            Serão criados cards com observações livres para cada participante.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-mist/80">Pré-visualização dos participantes</p>
          <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-mist/10 bg-navy/80 p-3">
            {preview.map((p) => (
              <span
                key={p.id}
                className="rounded-lg border border-accent/25 bg-navy-card px-2 py-1 text-[11px] text-mist/85"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-navy transition hover:bg-accent-dim disabled:opacity-60"
        >
          {loading ? "Criando…" : "Iniciar aplicação"}
        </button>
      </form>
    </div>
  );
}
