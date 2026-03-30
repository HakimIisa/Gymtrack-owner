"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Payment } from "@/lib/types";

interface Props {
  payments: Payment[];
}

function buildMonthlyData(payments: Payment[]) {
  const map: Record<string, number> = {};
  payments.forEach((p) => {
    const month = p.date.slice(0, 7); // "YYYY-MM"
    map[month] = (map[month] ?? 0) + p.amount;
  });

  const sorted = Object.keys(map).sort();
  return sorted.map((month) => {
    const [year, m] = month.split("-");
    const label = new Date(Number(year), Number(m) - 1).toLocaleString("default", { month: "short", year: "numeric" });
    return { month: label, revenue: map[month] };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-blue-400 font-semibold">₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function RevenueChart({ payments }: Props) {
  const data = useMemo(() => buildMonthlyData(payments), [payments]);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: "#52525b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="url(#revenueGrad)"
          strokeWidth={0}
          fill="url(#revenueGrad)"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="none"
          style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,0.6))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
