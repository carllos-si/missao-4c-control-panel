"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-accent/25 bg-navy-card p-5 shadow-xl shadow-black/40">
        <h2 id="confirm-title" className="text-lg font-semibold text-mist">
          {title}
        </h2>
        <p className="mt-2 text-sm text-mist/75">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-mist/20 px-4 py-2.5 text-sm text-mist/90 hover:bg-mist/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
