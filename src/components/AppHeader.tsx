"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Troque `src` por `/logo-missao-4c.png` após adicionar o arquivo em `public/`. */
const LOGO_SRC = "/icons/icon.svg";

export function AppHeader() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-accent/20 bg-navy-deep/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-accent/30 bg-navy-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="Missão 4C"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-mist">Missão 4C</p>
            <p className="truncate text-[11px] text-mist/60">Control Panel</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="shrink-0 rounded-lg border border-mist/20 px-3 py-1.5 text-xs text-mist/80 transition hover:border-accent/50 hover:text-accent"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
