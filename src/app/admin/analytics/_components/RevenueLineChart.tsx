"use client";

import type { DailyRevenue } from "@/app/admin/analytics/_lib/stripe-revenue";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDayLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-");
  if (!d || !m) return isoDay;
  return `${d}/${m}`;
}

export function RevenueLineChart({ data }: { data: DailyRevenue[] }) {
  const chartData = data.map((row) => ({
    ...row,
    revenueGbp: row.revenuePence / 100,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-brand-text/10" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#1C1C1C99" }}
            tickFormatter={formatDayLabel}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#1C1C1C99" }}
            tickFormatter={(v) =>
              `£${typeof v === "number" ? v.toFixed(0) : v}`
            }
          />
          <Tooltip
            formatter={(value) => {
              const v = value as number | string | undefined;
              const formatted =
                typeof v === "number"
                  ? `£${v.toFixed(2)}`
                  : (v ?? "—");
              return [formatted, "Revenue"];
            }}
            labelFormatter={(label) => `Date ${label}`}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(28,28,28,0.12)",
            }}
          />
          <Line
            type="monotone"
            dataKey="revenueGbp"
            stroke="#8BA888"
            strokeWidth={2}
            dot={{ r: 3, fill: "#8BA888" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
