"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#2f54e0", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#10b981", "#ec4899"];

const LABELS: Record<string, string> = {
  VENTE: "Vente",
  PRODUCTION: "Production",
  REBUT: "Rebut",
  PERTE: "Perte",
  RETOUR_CLIENT: "Retour client",
  TRANSFERT: "Transfert",
  AUTRE: "Autre",
};

type Row = { motif: string | null; total: number; quantite: number };

export function ExitReasonsChart({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    name: LABELS[d.motif ?? "AUTRE"] ?? d.motif ?? "Autre",
    value: d.quantite,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            label={(e: any) => `${e.value}`}
            labelLine={false}
          >
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
