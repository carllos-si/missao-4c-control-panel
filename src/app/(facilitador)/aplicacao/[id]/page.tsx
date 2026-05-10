import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationRecord, Participant } from "@/types/database";
import { AplicacaoClient } from "./ui";

function normalizeParticipants(raw: unknown): Participant[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p, i) => {
    const o = p as Record<string, unknown>;
    return {
      id: typeof o.id === "string" ? o.id : `p-${i}`,
      name: typeof o.name === "string" ? o.name : `Participante ${i + 1}`,
      observations: typeof o.observations === "string" ? o.observations : "",
    };
  });
}

export default async function AplicacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row, error } = await supabase
    .from("application_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) notFound();

  const record: ApplicationRecord = {
    id: row.id,
    user_id: row.user_id,
    company_name: row.company_name,
    applied_at: row.applied_at,
    participant_count: row.participant_count,
    participants: normalizeParticipants(row.participants),
    ai_report: row.ai_report,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-accent hover:underline">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-mist">{record.company_name}</h1>
        <p className="text-sm text-mist/65">Observações e laudo comportamental</p>
      </div>
      <AplicacaoClient initialRecord={record} />
    </div>
  );
}
