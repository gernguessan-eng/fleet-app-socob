"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#2f54e0", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type Row = { name: string | null; value: number };

export function StockByCategoryChart({ data }: { data: Row[] }) {
  const total = data.reduce((acc, d) => acc + Number(d.value || 0), 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.map((d) => ({ ...d, name: d.name ?? "Non catégorisé" }))}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-xs text-slate-500">
        Total : <span className="font-semibold text-slate-700">{total}</span> unités
      </div>
    </div>
  );
}
