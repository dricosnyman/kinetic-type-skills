/**
 * Example — labels in the scene (family 14, text living inside footage).
 *
 * WHAT IT SHOWS
 * Thin leader lines attach labels and measurements to a real object: a dot
 * lands on a point of the object, a line draws out from it, and the label
 * fades in at the line's end — one label after another. Here the object is a
 * drawn mug, labelled with the measurements for its volume, V = πr²h.
 *
 * HOW TO ADAPT IT FOR REAL FOOTAGE
 * - Put the footage (or a photo) underneath instead of the drawn mug, and
 *   set each label's anchor (ax, ay) to the point on the object, in px of a
 *   1920 × 1080 frame; (lx, ly) is where the label goes. Labels to the right
 *   of their anchor are left-aligned, labels to the left are right-aligned.
 * - If the camera moves, the anchors must move with it: track the points
 *   (After Effects, Resolve) and feed the per-frame positions in instead of
 *   fixed numbers.
 * - Keep labels short and away from the object's edges; two to four is plenty.
 */
import React from "react";
import { C, easeInOut, mix, prog } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type SceneLabel = {
  readonly text: string;
  /** The point on the object. */
  readonly ax: number;
  readonly ay: number;
  /** Where the label sits. */
  readonly lx: number;
  readonly ly: number;
};

export type LabelsInTheSceneProps = {
  readonly labels?: readonly SceneLabel[];
};

const DESIGN = 4; // design seconds
const BOX = { x: 260, y: 260, w: 1400, h: 560 };

const DEFAULT_LABELS: SceneLabel[] = [
  { text: "h = 9 cm", ax: 1080, ay: 560, lx: 1320, ly: 430 },
  { text: "r = 4 cm", ax: 970, ay: 460, lx: 640, ly: 380 },
  { text: "V = πr²h ≈ 452 cm³", ax: 970, ay: 640, lx: 640, ly: 720 },
];

export const LabelsInTheScene: React.FC<LabelsInTheSceneProps> = ({ labels = DEFAULT_LABELS }) => {
  const t = useSceneTime(DESIGN);
  const gap = Math.min(0.6, (DESIGN - 1.6) / Math.max(1, labels.length));
  return (
    <Canvas>
      <div style={{ position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, overflow: "hidden", borderRadius: 24, background: "#EADFCF" }}>
        {/* the object: a table and a mug (in real use, the footage goes here) */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "#B88A5E" }} />
        <div
          style={{
            position: "absolute",
            left: 600,
            top: 200,
            width: 220,
            height: 280,
            background: "#FFFFFF",
            borderRadius: "10px 10px 40px 40px",
            boxShadow: "0 10px 0 rgba(0,0,0,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 800,
            top: 260,
            width: 90,
            height: 130,
            border: "22px solid #FFFFFF",
            borderLeft: "none",
            borderRadius: "0 60px 60px 0",
          }}
        />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {labels.map((l, i) => {
          const a = 0.4 + i * gap;
          const p = prog(t, a, a + 0.6, easeInOut);
          const right = l.lx >= l.ax;
          return (
            <g key={i}>
              <circle cx={l.ax} cy={l.ay} r={9 * Math.min(1, p * 3)} fill={C.blue} />
              <line x1={l.ax} y1={l.ay} x2={mix(p, l.ax, l.lx)} y2={mix(p, l.ay, l.ly)} stroke={C.blue} strokeWidth={4} />
              <text
                x={l.lx + (right ? 16 : -16)}
                y={l.ly + 16}
                textAnchor={right ? "start" : "end"}
                fontWeight={700}
                fontSize={48}
                fill={C.blue}
                opacity={prog(t, a + 0.5, a + 0.8)}
              >
                {l.text}
              </text>
            </g>
          );
        })}
      </svg>
    </Canvas>
  );
};
