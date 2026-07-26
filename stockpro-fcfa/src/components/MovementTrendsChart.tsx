"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";

type Row = { date: string; type: string; total: number; valeur: number };

export function MovementTrendsChart({ data }: { data: Row[] }) {
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; ENTREE: number; SORTIE: number }>();
    for (const row of data) {
      const d = row.date.slice(5);
      const item = map.get(d) ?? { date: d, ENTREE: 0, SORTIE: 0 };
      if (row.type === "ENTREE") item.ENTREE = Number(row.total);
      if (row.type === "SORTIE") item.SORTIE = Number(row.total);
      map.set(d, item);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEntree" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSortie" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="ENTREE" name="Entrées" stroke="#10b981" strokeWidth={2} fill="url(#colorEntree)" />
          <Area type="monotone" dataKey="SORTIE" name="Sorties" stroke="#ef4444" strokeWidth={2} fill="url(#colorSortie)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
