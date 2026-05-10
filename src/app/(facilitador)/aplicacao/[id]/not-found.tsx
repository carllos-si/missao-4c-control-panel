import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-bold text-mist">Aplicação não encontrada</h1>
      <p className="text-sm text-mist/65">Verifique o link ou volte ao painel.</p>
      <Link href="/dashboard" className="inline-block text-accent hover:underline">
        Ir ao painel
      </Link>
    </div>
  );
}
