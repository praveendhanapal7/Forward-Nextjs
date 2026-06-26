"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
  LabelList,
} from "recharts";
import { PieChartIcon, BarChart2 } from "lucide-react";

export interface StatusCount {
  status: string;
  label: string;
  color: string;
  count: number;
}

interface Props {
  counts: StatusCount[];
  total: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StatusCount; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="ChartTooltip">
      <span className="ChartTooltipDot" style={{ background: d.color }} />
      <span className="ChartTooltipLabel">{d.label}</span>
      <span className="ChartTooltipCount">{d.count}</span>
    </div>
  );
}

function CustomLegend({ counts, total }: { counts: StatusCount[]; total: number }) {
  return (
    <div className="ChartLegend">
      {counts.map((s) => (
        <div key={s.status} className="ChartLegendItem">
          <span className="ChartLegendDot" style={{ background: s.color }} />
          <span className="ChartLegendLabel">{s.label}</span>
          <span className="ChartLegendCount">{s.count} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)</span>
        </div>
      ))}
    </div>
  );
}

export function StatusChart({ counts, total }: Props) {
  const [view, setView] = useState<"pie" | "bar">("pie");

  if (counts.length === 0) {
    return (
      <div className="StatusGraphEmpty">
        No leads match the current filter selection.
      </div>
    );
  }

  return (
    <div className="StatusChartWrap">
      <div className="StatusChartHeader">
        <div className="StatusChartToggle">
          <button
            className={`StatusChartToggleBtn ${view === "pie" ? "StatusChartToggleBtnActive" : ""}`}
            onClick={() => setView("pie")}
            aria-label="Donut chart"
          >
            <PieChartIcon size={14} />
            <span>Donut</span>
          </button>
          <button
            className={`StatusChartToggleBtn ${view === "bar" ? "StatusChartToggleBtnActive" : ""}`}
            onClick={() => setView("bar")}
            aria-label="Bar chart"
          >
            <BarChart2 size={14} />
            <span>Bar</span>
          </button>
        </div>
        <div className="StatusChartTotal">
          <span className="StatusChartTotalNum">{total}</span>
          <span className="StatusChartTotalLabel">Filtered Leads</span>
        </div>
      </div>

      <div className="StatusChartBody">
        {view === "pie" ? (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={counts}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="72%"
                  dataKey="count"
                  paddingAngle={counts.length > 1 ? 2 : 0}
                  strokeWidth={2}
                  stroke="#ffffff"
                  isAnimationActive={false}
                >
                  <Label
                    content={({ viewBox }) => {
                      const vb = viewBox as { cx?: number; cy?: number };
                      const cx = vb.cx ?? 0;
                      const cy = vb.cy ?? 0;
                      return (
                        <g>
                          <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fill="#ce050d" fontSize={26} fontWeight={700}>{total}</text>
                          <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize={10} fontWeight={600} letterSpacing="0.08em">LEADS</text>
                        </g>
                      );
                    }}
                  />
                  {counts.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend counts={counts} total={total} />
          </>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={counts}
              margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
              barSize={28}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {counts.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
