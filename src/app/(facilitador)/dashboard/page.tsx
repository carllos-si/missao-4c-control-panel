import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./ui";

export default async function DashboardPage() {
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

  const { data: rows, error } = await supabase
    .from("application_records")
    .select(
      "id, company_name, applied_at, participant_count, created_at, ai_report"
    )
    .order("applied_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-100">
        Erro ao carregar histórico: {error.message}. Confira se a tabela{" "}
        <code className="text-red-200">application_records</code> existe e as políticas RLS estão
        ativas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mist">Painel</h1>
          <p className="text-sm text-mist/65">Empresas / clientes e histórico de aplicações</p>
        </div>
        <Link
          href="/aplicacao/nova"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-navy shadow-lg shadow-accent/10 transition hover:bg-accent-dim"
        >
          Nova aplicação
        </Link>
      </div>
      <DashboardClient initialRows={rows ?? []} />
    </div>
  );
}
