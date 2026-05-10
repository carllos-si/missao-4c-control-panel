import { AppHeader } from "@/components/AppHeader";

export default function FacilitadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="safe-bottom mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
