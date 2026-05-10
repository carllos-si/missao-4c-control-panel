"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportReviewModal } from "@/components/ReportReviewModal";
import type { ApplicationRecord, Participant } from "@/types/database";

function formatAppliedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AplicacaoClient({ initialRecord }: { initialRecord: ApplicationRecord }) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const appliedLabel = useMemo(() => formatAppliedAt(record.applied_at), [record.applied_at]);

  const updateParticipant = useCallback((id: string, patch: Partial<Participant>) => {
    setRecord((r) => ({
      ...r,
      participants: r.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  async function saveParticipants(report?: string | null) {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const payload = {
        participants: record.participants,
        participant_count: record.participants.length,
        ...(report !== undefined ? { ai_report: report } : {}),
        updated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase
        .from("application_records")
        .update(payload)
        .eq("id", record.id);
      if (upErr) {
        setError(upErr.message);
        return false;
      }
      if (report !== undefined) {
        setRecord((r) => ({ ...r, ai_report: report }));
      }
      router.refresh();
      return true;
    } catch {
      setError("Falha ao salvar.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    await saveParticipants();
  }

  async function handleGenerateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: record.company_name,
          appliedAt: record.applied_at,
          participants: record.participants,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar laudo");
        return;
      }
      const report = data.report as string;
      const ok = await saveParticipants(report);
      if (ok) setModalOpen(true);
    } catch {
      setError("Não foi possível contatar o servidor.");
    } finally {
      setGenerating(false);
    }
  }

  const canOpenModal = Boolean(record.ai_report?.trim());

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-mist/55">Aplicação: {appliedLabel}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSaveDraft()}
              disabled={saving}
              className="rounded-xl border border-mist/20 px-3 py-2 text-xs font-medium text-mist/90 hover:bg-mist/5 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generating}
              className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-navy hover:bg-accent-dim disabled:opacity-50"
            >
              {generating ? "Gerando…" : "Gerar relatório final (IA)"}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!canOpenModal}
              className="rounded-xl border border-accent/40 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-40"
            >
              Revisar / PDF
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-200">{error}</p>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent/90">
            Observações por participante
          </h2>
          <ul className="space-y-4">
            {record.participants.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-mist/10 bg-navy-card p-4 shadow-inner shadow-black/20"
              >
                <label htmlFor={`name-${p.id}`} className="block text-xs font-medium text-mist/70">
                  Nome
                </label>
                <input
                  id={`name-${p.id}`}
                  value={p.name}
                  onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-mist/15 bg-navy px-3 py-2 text-sm text-mist outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
                />
                <label
                  htmlFor={`obs-${p.id}`}
                  className="mt-3 block text-xs font-medium text-mist/70"
                >
                  Observações livres
                </label>
                <textarea
                  id={`obs-${p.id}`}
                  value={p.observations}
                  onChange={(e) => updateParticipant(p.id, { observations: e.target.value })}
                  rows={5}
                  className="mt-1 w-full resize-y rounded-xl border border-mist/15 bg-navy px-3 py-2 text-sm text-mist outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
                  placeholder="Notas de comportamento durante a dinâmica…"
                />
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={() => handleSaveDraft()}
          disabled={saving}
          className="w-full rounded-xl border border-mist/20 py-3 text-sm text-mist/90 hover:bg-mist/5 disabled:opacity-50 sm:hidden"
        >
          Salvar rascunho
        </button>
      </div>

      <ReportReviewModal
        open={modalOpen && Boolean(record.ai_report?.trim())}
        onClose={() => setModalOpen(false)}
        companyName={record.company_name}
        appliedAtLabel={appliedLabel}
        reportMarkdown={record.ai_report ?? ""}
      />
    </>
  );
}
