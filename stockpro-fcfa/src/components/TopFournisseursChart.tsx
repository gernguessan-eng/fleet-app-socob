"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Row = { nom: string | null; total: number; quantite: number };

export function TopFournisseursChart({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    nom: d.nom ?? "—",
    total: d.total,
    quantite: d.quantite,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis dataKey="nom" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={130} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v: any) => `${v} FCFA`}
          />
          <Bar dataKey="total" name="CA" fill="#2f54e0" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
