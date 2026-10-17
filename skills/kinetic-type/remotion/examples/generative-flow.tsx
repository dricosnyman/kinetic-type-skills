/**
 * Example — generative flow (family 17, code and generative type).
 *
 * WHAT IT SHOWS
 * The text is made of dots. A flow field — an invisible, smoothly swirling
 * pattern of arrows covering the frame — pushes every dot along its arrow:
 * the word blows apart into swirls of colour, then the field calms and the
 * dots drift home, and the word is whole again.
 *
 * HOW IT WORKS
 * - The dots: the text is laid out like any component (useKTLayout) and
 *   sampled into cells (inkCells); every cell that is at least half ink
 *   becomes a dot at its home position.
 * - The field: the push direction at (column c, row r) is an angle made of
 *   two sine waves, ang = 2·sin(0.08c + t) + 2·cos(0.12r − 0.7t). Nearby dots
 *   get nearly the same angle, so they move together in smooth streams.
 * - The storm strength goes 0 → 1 → 0 (half a sine wave), so the text starts
 *   and ends readable.
 *
 * HOW TO ADAPT IT
 * - `text` (short and bold works best: one to three words), `color`, `accent`
 *   (the dots' colour while they are blown about).
 * - Change the field's numbers for a different swirl: bigger multipliers on
 *   c and r give tighter swirls; PUSH sets how far the dots travel.
 * - Unlike the other examples this one uses the composition's own size
 *   (like the components), not the 1920 × 1080 canvas.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, prog } from "../kit";
import { cellForBudget, inkCells, useKTLayout } from "../layout";
import { useSceneTime } from "./scene";

export type GenerativeFlowProps = {
  readonly text?: string;
  readonly color?: string;
  readonly accent?: string;
};

const DESIGN = 4; // design seconds
const PUSH = 1.4; // how far the dots travel, in em

export const GenerativeFlow: React.FC<GenerativeFlowProps> = ({ text = "FLOW", color = C.ink, accent = C.teal }) => {
  const t = useSceneTime(DESIGN);
  const L = useKTLayout({ text, color, accent }, { fontWeight: 900 });
  if (!L.ready || L.words.length === 0) return <AbsoluteFill />;
  const cell = cellForBudget(L, 3000, L.fontSize / 16);
  const g = inkCells(L, cell);
  const storm = Math.sin(prog(t, 0.3, DESIGN - 0.6, (x) => x) * Math.PI); // 0 → 1 → 0
  const push = PUSH * L.fontSize * storm;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < g.ink.length; i++) {
    if (g.ink[i] < 0.5) continue;
    const c = i % g.cols;
    const r = Math.floor(i / g.cols);
    const ang = Math.sin(c * 0.08 + t) * 2 + Math.cos(r * 0.12 - t * 0.7) * 2;
    dots.push(
      <circle
        key={i}
        cx={(c + 0.5) * cell + Math.cos(ang) * push}
        cy={(r + 0.5) * cell + Math.sin(ang) * push}
        r={cell * 0.38}
        fill={storm > 0.3 ? L.accent : L.color}
      />,
    );
  }
  return (
    <AbsoluteFill>
      <svg style={{ position: "absolute", left: g.x0, top: g.y0, overflow: "visible" }} width={g.cols * cell} height={g.rows * cell}>
        {dots}
      </svg>
    </AbsoluteFill>
  );
};
