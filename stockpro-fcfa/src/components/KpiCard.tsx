import clsx from "clsx";

export function KpiCard({
  label,
  value,
  subtext,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  subtext?: string;
  icon?: string;
  tone?: "default" | "brand" | "ok" | "danger";
}) {
  const toneClasses = {
    default: "from-slate-50 to-white border-slate-200",
    brand: "from-brand-50 to-white border-brand-200",
    ok: "from-emerald-50 to-white border-emerald-200",
    danger: "from-rose-50 to-white border-rose-200",
  } as const;

  return (
    <div
      className={clsx(
        "rounded-xl border bg-gradient-to-br p-5 shadow-sm transition hover:shadow-md",
        toneClasses[tone],
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {subtext ? (
            <div className="mt-1 text-xs text-slate-500">{subtext}</div>
          ) : null}
        </div>
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-xl shadow-sm">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
