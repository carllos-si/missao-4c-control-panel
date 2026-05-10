"use client";

import { useCallback, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  companyName: string;
  appliedAtLabel: string;
  reportMarkdown: string;
};

export function ReportReviewModal({
  open,
  onClose,
  companyName,
  appliedAtLabel,
  reportMarkdown,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    setExportError(null);
    setExporting(true);
    try {
      const el = document.getElementById("pdf-export-root");
      if (!el) throw new Error("Área de exportação não encontrada");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d1b2a",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const usableW = pageWidth - margin * 2;
      const usableH = pageHeight - margin * 2;
      const imgWidth = usableW;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      let heightLeft = imgHeight - usableH;

      while (heightLeft > 0) {
        const position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableH;
      }

      const safeName = companyName.replace(/[^\w\d\-]+/g, "_").slice(0, 48);
      pdf.save(`Missao4C_${safeName}.pdf`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Falha ao gerar PDF");
    } finally {
      setExporting(false);
    }
  }, [companyName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-accent/25 bg-navy-card shadow-2xl sm:rounded-2xl">
        <div className="border-b border-mist/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-mist">Revisar relatório final</h2>
          <p className="text-xs text-mist/60">
            {companyName} · {appliedAtLabel}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div
            id="pdf-export-root"
            className="rounded-xl border border-mist/10 bg-navy p-4 text-sm text-mist/95"
            style={{ width: 520, maxWidth: "100%", margin: "0 auto" }}
          >
            <p className="text-xs uppercase tracking-wider text-accent">Missão 4C — Laudo</p>
            <h3 className="mt-1 text-base font-bold text-mist">{companyName}</h3>
            <p className="text-xs text-mist/60">{appliedAtLabel}</p>
            <hr className="my-4 border-mist/15" />
            <div className="whitespace-pre-wrap font-sans leading-relaxed">{reportMarkdown}</div>
          </div>
          {exportError && (
            <p className="mt-3 text-center text-xs text-red-300">{exportError}</p>
          )}
        </div>
        <div className="safe-bottom flex flex-col-reverse gap-2 border-t border-mist/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-mist/20 px-4 py-2.5 text-sm text-mist/90 hover:bg-mist/5"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={exporting}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-navy hover:bg-accent-dim disabled:opacity-60"
          >
            {exporting ? "Exportando…" : "Exportar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
