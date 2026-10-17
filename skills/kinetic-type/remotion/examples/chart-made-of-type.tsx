/**
 * Example — chart made of type (family 16, text as data).
 *
 * WHAT IT SHOWS
 * A bar chart where each bar is a word repeated: the number of repeats is the
 * data, so the length of the bar is the value. The bars grow one after
 * another, and each value appears when its bar is complete. The default data
 * shows the Pythagoras squares for a 3-4-5 triangle: 9 + 16 = 25.
 *
 * HOW IT WORKS
 * - A bar is just the label repeated `round(value / unit)` times; growing it
 *   means showing more repeats as time passes.
 * - The font size is chosen so the longest bar fits the chart's width.
 *
 * HOW TO ADAPT IT
 * - `rows`: { label, value, color? }; `unit` is the value one repeat stands
 *   for (default 1). Keep it to 2–6 rows and up to about 30 repeats per bar
 *   (raise `unit` for big numbers).
 * - The word in the bar is the label; for long labels, use a short tag
 *   instead (e.g. the first three letters).
 * - Type charts are for a feeling of size, not precise reading: say the
 *   numbers too.
 */
import React from "react";
import { measureText } from "@remotion/layout-utils";
import { C, easeInOut, poppins, prog } from "../kit";
import { useFontsReady } from "../layout";
import { Canvas, useSceneTime } from "./scene";

export type TypeChartRow = { readonly label: string; readonly value: number; readonly color?: string };

export type ChartMadeOfTypeProps = {
  readonly rows?: readonly TypeChartRow[];
  readonly unit?: number;
};

const DESIGN = 4; // design seconds
const CHART_W = 1700;
const LABEL_W = 180;
const PALETTE = [C.blue, C.teal, C.orange, C.yellow];

const DEFAULT_ROWS: TypeChartRow[] = [
  { label: "a²", value: 9 },
  { label: "b²", value: 16 },
  { label: "c²", value: 25 },
];

export const ChartMadeOfType: React.FC<ChartMadeOfTypeProps> = ({ rows = DEFAULT_ROWS, unit = 1 }) => {
  const t = useSceneTime(DESIGN);
  const ready = useFontsReady(poppins, 900);
  if (!ready) return <Canvas>{null}</Canvas>;
  const counts = rows.map((r) => Math.max(0, Math.round(r.value / unit)));
  // Size: the longest bar (label + space, repeated) fits beside the labels, with room for the value.
  const bar100 = (r: TypeChartRow, i: number) =>
    counts[i] * measureText({ text: `${r.label} `, fontFamily: poppins, fontSize: 100, fontWeight: 900 }).width;
  const longest = Math.max(1, ...rows.map(bar100));
  const fontSize = Math.min(72, ((CHART_W - LABEL_W - 280) * 100) / longest);
  const step = Math.min(0.35, 1.2 / Math.max(1, rows.length));
  return (
    <Canvas>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: fontSize * 0.5,
        }}
      >
        {rows.map((r, i) => {
          const p = prog(t, 0.3 + i * step, 1.6 + i * step, easeInOut);
          const n = Math.round(counts[i] * p);
          const color = r.color ?? PALETTE[i % PALETTE.length];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, width: CHART_W }}>
              <div style={{ width: LABEL_W, textAlign: "right", fontSize: 48, fontWeight: 700 }}>{r.label}</div>
              <div style={{ fontSize, fontWeight: 900, color, whiteSpace: "nowrap" }}>{`${r.label} `.repeat(n)}</div>
              <div style={{ fontSize: 44, fontWeight: 600, color: C.muted, opacity: p >= 1 ? 1 : 0 }}>{r.value}</div>
            </div>
          );
        })}
      </div>
    </Canvas>
  );
};
