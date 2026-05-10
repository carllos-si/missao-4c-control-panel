"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Row = {
  id: string;
  company_name: string;
  applied_at: string;
  participant_count: number;
  created_at: string;
  ai_report: string | null;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DashboardClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()),
    [rows]
  );

  async function confirmDelete() {
    if (!pendingId) return;
    const id = pendingId;
    setPendingId(null);
    const supabase = createClient();
    const { error } = await supabase.from("application_records").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    router.refresh();
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-accent/30 bg-navy-card/50 p-8 text-center">
        <p className="text-mist/80">Nenhuma aplicação registrada ainda.</p>
        <Link href="/aplicacao/nova" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Iniciar primeira aplicação
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {sorted.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-2xl border border-mist/10 bg-navy-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-mist">{r.company_name}</p>
              <p className="mt-1 text-xs text-mist/60">
                Aplicação: {formatDate(r.applied_at)} · {r.participant_count} participante(s)
                {r.ai_report ? " · Laudo gerado" : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={`/aplicacao/${r.id}`}
                className="rounded-xl border border-accent/40 px-3 py-2 text-center text-xs font-medium text-accent hover:bg-accent/10"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => setPendingId(r.id)}
                className="rounded-xl border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-950/40"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pendingId !== null}
        title="Excluir registro?"
        message="Esta ação remove permanentemente a aplicação e o laudo associados. Não é possível desfazer."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
}
