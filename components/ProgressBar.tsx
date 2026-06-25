/**
 * Download progress indicator. The /api/download response streams a file with a
 * known Content-Length, so the client can show a real percentage as bytes
 * arrive. When the size is unknown we fall back to an indeterminate bar.
 */
export function ProgressBar({
  percent,
  label,
}: {
  percent: number | null;
  label?: string;
}) {
  const indeterminate = percent === null;
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label || "Downloading…"}</span>
        {!indeterminate && <span>{Math.round(percent!)}%</span>}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={
            indeterminate
              ? "h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-primary"
              : "h-full rounded-full bg-primary transition-[width] duration-200"
          }
          style={indeterminate ? undefined : { width: `${Math.min(100, percent!)}%` }}
        />
      </div>
      <style>{`
        @keyframes indeterminate {
          0% { margin-left: -33%; }
          100% { margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
