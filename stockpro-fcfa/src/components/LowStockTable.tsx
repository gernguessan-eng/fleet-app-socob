import { formatNumber } from "@/lib/format";

type Row = {
  id: number;
  codeArticle: string;
  reference: string;
  designation: string;
  stockActuel: number;
  stockMin: number;
  emplacement: string | null;
};

export function LowStockTable({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-lg bg-emerald-50 text-sm text-emerald-700">
        ✅ Aucun article sous le seuil minimum
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th className="pb-2 font-medium">Article</th>
            <th className="pb-2 font-medium text-right">Stock</th>
            <th className="pb-2 font-medium text-right">Min</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 last:border-0">
              <td className="py-2.5">
                <div className="font-medium text-slate-900">{d.designation}</div>
                <div className="text-[11px] text-slate-500">
                  {d.codeArticle} • {d.emplacement ?? "—"}
                </div>
              </td>
              <td className="py-2.5 text-right">
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {formatNumber(d.stockActuel)}
                </span>
              </td>
              <td className="py-2.5 text-right text-slate-500">
                {formatNumber(d.stockMin)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
