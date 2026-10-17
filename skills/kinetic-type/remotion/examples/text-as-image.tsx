/**
 * Example — text-as-image (family 0).
 *
 * WHAT IT SHOWS
 * A right-angled triangle drawn entirely out of words: its body is rows of
 * the word "triangle" (each row slides in from alternating sides, and the
 * rows are clipped to the triangle's shape), its long side is the word
 * "hypotenuse" running along the edge, and the right angle is marked by a
 * little square. Then the camera zooms right in, so you can see it really is
 * just words, and back out.
 *
 * HOW IT WORKS
 * - Body: plain SVG <text> rows inside a <clipPath> with the shape's outline.
 *   Any shape works: swap the clip path (a mug, a heart, a country).
 * - Edges and details: <textPath> runs a word along a path (the hypotenuse
 *   here). A path's left side is where the letters stand, so draw the path in
 *   the direction that puts the letters outside the shape.
 * - The zoom is one scale() on the whole picture, around a chosen point.
 *
 * HOW TO ADAPT IT
 * - `word` fills the shape, `edgeWord` runs along the long side.
 * - For another object: draw its outline as SHAPE (an SVG path), set ROWS to
 *   cover its height, and add a textPath for each detail (a handle, steam…).
 * - Keep the fill word short: long words leave ragged gaps at the edges.
 */
import React from "react";
import { interpolate } from "remotion";
import { C, clamp, easeInOut, mix, prog } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type TextAsImageProps = {
  readonly word?: string;
  readonly edgeWord?: string;
};

const DESIGN = 8; // design seconds

// The triangle: right angle at A (bottom left), B bottom right, T top.
const A = { x: 620, y: 880 };
const B = { x: 1400, y: 880 };
const T = { x: 620, y: 300 };
const SHAPE = `M ${T.x} ${T.y} L ${B.x} ${B.y} L ${A.x} ${A.y} Z`;
const ROW_H = 46;
const ROWS = Math.ceil((A.y - T.y) / ROW_H);
const RIGHT_ANGLE = 46; // size of the right-angle mark
// The hypotenuse label's baseline: parallel to T→B, pushed 24 px outwards.
const HYP_LEN = Math.hypot(B.x - T.x, B.y - T.y);
const OUT = { x: ((B.y - T.y) / HYP_LEN) * 24, y: (-(B.x - T.x) / HYP_LEN) * 24 };

export const TextAsImage: React.FC<TextAsImageProps> = ({ word = "triangle", edgeWord = "hypotenuse" }) => {
  const t = useSceneTime(DESIGN);
  const row = new Array(16).fill(word).join(" ");
  const edge = prog(t, 2.2, 3.2);
  const mark = prog(t, 3.0, 3.5);
  // Zoom in to read the words, then back out.
  const z = interpolate(t, [4.2, 5.2, 6.4, 7.3], [1, 3.4, 3.4, 1], { ...clamp, easing: easeInOut });
  return (
    <Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", scale: `${z}`, transformOrigin: "760px 700px" }}>
        <defs>
          <clipPath id="kt-example-triangle">
            <path d={SHAPE} />
          </clipPath>
          {/* Drawn from T to B, so the letters stand on the outside. */}
          <path id="kt-example-hyp" d={`M ${T.x + OUT.x} ${T.y + OUT.y} L ${B.x + OUT.x} ${B.y + OUT.y}`} />
        </defs>
        <g clipPath="url(#kt-example-triangle)">
          {new Array(ROWS).fill(0).map((_, i) => {
            const p = prog(t, 0.2 + i * 0.12, 1.0 + i * 0.12);
            const dir = i % 2 ? 1 : -1;
            return (
              <text
                key={i}
                x={A.x - 40 - (i % 3) * 30 + dir * (1 - p) * 900}
                y={T.y + 36 + i * ROW_H}
                fontSize={40}
                fontWeight={800}
                fill={i % 2 ? C.blue : "#5B83F5"}
                opacity={p}
              >
                {row}
              </text>
            );
          })}
        </g>
        <text fontSize={46} fontWeight={800} fill={C.orange} opacity={edge}>
          <textPath href="#kt-example-hyp" startOffset={`${mix(edge, -60, 4)}%`}>
            {`${edgeWord} · ${edgeWord}`}
          </textPath>
        </text>
        <path
          d={`M ${A.x + 6} ${A.y - RIGHT_ANGLE} H ${A.x + RIGHT_ANGLE} V ${A.y - 6}`}
          fill="none"
          stroke={C.ink}
          strokeWidth={6}
          opacity={mark}
        />
      </svg>
    </Canvas>
  );
};
