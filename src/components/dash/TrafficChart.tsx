"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/affiliate/stats";

export default function TrafficChart({ data }: { data: SeriesPoint[] }) {
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${m}/${day}`;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <defs>
            <linearGradient id="g-clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f6bff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2f6bff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-conv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(11,18,32,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: "#5b6577" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#5b6577" }}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(11,18,32,0.1)",
              fontSize: 12,
            }}
            labelFormatter={(label) => fmt(String(label))}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#2f6bff"
            strokeWidth={2}
            fill="url(#g-clicks)"
            name="Clicks"
          />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#g-conv)"
            name="Conversions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
