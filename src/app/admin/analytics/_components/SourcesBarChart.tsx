"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SourcesBarChart({
  data,
}: {
  data: { source: string; sessions: number }[];
}) {
  const chartData = data.map((row) => ({
    ...row,
    label:
      row.source.length > 24
        ? `${row.source.slice(0, 22)}…`
        : row.source,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-brand-text/10" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fontSize: 10, fill: "#1C1C1C99" }}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value : Number(value ?? 0),
              "Sessions",
            ]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { source?: string })?.source ?? ""
            }
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(28,28,28,0.12)",
            }}
          />
          <Bar dataKey="sessions" fill="#8BA888" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
