import { formatNumber } from "@/lib/format";

type Row = {
  articleId: number;
  codeArticle: string | null;
  designation: string | null;
  total: number;
};

export function TopArticlesTable({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-40 place-items-center text-sm text-slate-400">
        Aucun mouvement récent
      </div>
    );
  }
  const max = Math.max(...data.map((d) => Number(d.total)));
  return (
    <div className="space-y-3">
      {data.map((d, idx) => {
        const pct = (Number(d.total) / max) * 100;
        return (
          <div key={d.articleId}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">
                    {d.designation ?? "—"}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {d.codeArticle}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {formatNumber(d.total)}
              </div>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
