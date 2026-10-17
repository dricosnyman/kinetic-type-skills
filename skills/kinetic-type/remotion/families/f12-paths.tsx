/**
 * Family 12 — paths and geometry: text that follows a line (a curve, a circle,
 * a spiral).
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). The badge and the spiral
 * keep turning slowly after that: the rotation is the technique.
 *
 * The text runs along an SVG path in one piece (it does not wrap onto lines),
 * so the font size is solved to make the whole text fit the path. Long text
 * gets smaller letters.
 */
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { easeInOut, easeOut, mix, prog, useSettle } from "../kit";
import { KTLayout, useKTLayout } from "../layout";
import type { KTProps } from "../types";

/** A clean, unique id for SVG paths (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

/** Width of the whole text (words joined by single spaces) at 100px. */
const width100 = (L: KTLayout, text: string): number =>
  text.length === 0 ? 0 : measureText({ text, fontFamily: L.fontFamily, fontSize: 100, fontWeight: L.fontWeight }).width;

const joined = (L: KTLayout) => L.words.map((w) => w.text).join(" ");

/** The words as SVG tspans, the key word in the accent colour. */
const Spans: React.FC<{ L: KTLayout }> = ({ L }) => (
  <>
    {L.words.map((w, i) => (
      <React.Fragment key={i}>
        {i > 0 ? " " : null}
        <tspan fill={w.isKey ? L.accent : L.color}>{w.text}</tspan>
      </React.Fragment>
    ))}
  </>
);

/** An SVG path through points, and its length. */
const polyline = (pts: [number, number][]) => {
  let d = "";
  let len = 0;
  pts.forEach(([x, y], i) => {
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    if (i > 0) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
  });
  return { d, len };
};

/** The default biggest size, as useKTLayout uses it. */
const maxSizeOf = (props: KTProps, L: KTLayout) => props.fontSize ?? Math.min(L.width * 0.075, L.height * 0.16);

// ---------------------------------------------------------------------------
// Text on a path: the text rides along a curve — here two waves of y = sin x
// across the frame. The curve draws itself, then the text slides along it into
// place. The key word is in the accent colour.

export const TextOnAPath: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const id = useSvgId("kt-sine");
  if (!L.ready || L.words.length === 0) return null;
  const PW = L.width * 0.86;
  const A = L.height * 0.12;
  const x0 = (L.width - PW) / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * PW;
    pts.push([x0 + x, L.height / 2 - Math.sin((x / PW) * Math.PI * 4) * A]);
  }
  const { d, len } = polyline(pts);
  const w100 = width100(L, joined(L));
  const fs = Math.min(maxSizeOf(props, L), A * 0.9, (0.94 * len * 100) / Math.max(1, w100));
  const textW = (w100 * fs) / 100;
  const draw = prog(u, 0, 0.5, easeInOut);
  const ride = prog(u, 0.15, 1, easeOut);
  return (
    <AbsoluteFill>
      <svg width={L.width} height={L.height} style={{ overflow: "visible" }}>
        <path id={id} d={d} fill="none" />
        <path
          d={d}
          fill="none"
          stroke={L.color}
          strokeOpacity={0.18}
          strokeWidth={Math.max(2, fs * 0.05)}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        <text
          fontFamily={L.fontFamily}
          fontWeight={L.fontWeight}
          fontSize={fs}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <textPath href={`#${id}`} startOffset={mix(ride, -textW / 2, len / 2)}>
            <Spans L={L} />
          </textPath>
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Circular badge: the text runs round a circle — repeated, with dots between,
// until the ring is full — and the badge slowly rotates. The key word also
// sits in an accent disc in the middle (a tick when there is no key word).

export const CircularBadge: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u, t } = useSettle();
  const id = useSvgId("kt-badge");
  if (!L.ready || L.words.length === 0) return null;
  const cx = L.width / 2;
  const cy = L.height / 2;
  const R = 0.34 * Math.min(L.width, L.height);
  const circ = 2 * Math.PI * R;
  const unit = `${joined(L)} · `;
  const u100 = Math.max(1, width100(L, unit));
  // As many copies as fit at about 0.17 R, then the size that fills the ring exactly.
  const n = Math.max(1, Math.round(circ / ((u100 * 0.17 * R) / 100)));
  const fs = (circ * 100) / (n * u100);
  const grow = prog(u, 0, 0.6, easeInOut);
  const key = L.keyIndex >= 0 ? L.words[L.keyIndex].text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || "✓" : "✓";
  const disc = 0.58 * R;
  const keyFs = Math.min(0.5 * disc, (1.5 * disc * 100) / Math.max(1, width100(L, key)));
  const discIn = prog(u, 0.3, 0.8, easeOut);
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.2) }}>
      <svg
        width={L.width}
        height={L.height}
        style={{ position: "absolute", rotate: `${(t * 15).toFixed(2)}deg`, scale: `${mix(grow, 0.6, 1)}` }}
      >
        <path id={id} d={`M ${cx - R} ${cy} a ${R} ${R} 0 1 1 ${2 * R} 0 a ${R} ${R} 0 1 1 ${-2 * R} 0`} fill="none" />
        <text fontFamily={L.fontFamily} fontWeight={L.fontWeight} fontSize={fs}>
          <textPath href={`#${id}`}>
            {new Array(n).fill(0).map((_, k) => (
              <React.Fragment key={k}>
                <Spans L={L} />
                {" · "}
              </React.Fragment>
            ))}
          </textPath>
        </text>
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - disc,
          top: cy - disc,
          width: 2 * disc,
          height: 2 * disc,
          borderRadius: "50%",
          background: L.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: L.fontFamily,
          fontWeight: 900,
          fontSize: keyFs,
          color: "#FFFFFF",
          whiteSpace: "nowrap",
          scale: `${discIn}`,
        }}
      >
        {key}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Spiral: the text flows in along a spiral (the radius shrinks as the angle
// grows: r = a − bθ), starting on the outside and curling towards the centre,
// and the spiral slowly turns. Short text is repeated (with dots between) so
// the spiral is full; long text gets smaller letters. The first copy starts
// on the outside, where it is easiest to read. The key word is in the accent colour.

const TURNS = 3;

export const Spiral: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u, t } = useSettle();
  const id = useSvgId("kt-spiral");
  if (!L.ready || L.words.length === 0) return null;
  const cx = L.width / 2;
  const cy = L.height / 2;
  const Rout = 0.44 * Math.min(L.width, L.height);
  const Rin = 0.14 * Rout;
  const pts: [number, number][] = [];
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const th = -Math.PI + (i / N) * TURNS * Math.PI * 2;
    const r = Rout - (Rout - Rin) * (i / N);
    pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
  }
  const { d, len } = polyline(pts);
  const w100 = Math.max(1, width100(L, joined(L)));
  const sep100 = width100(L, " · ");
  // Letters must fit between one turn and the next.
  const fs = Math.min(maxSizeOf(props, L), ((Rout - Rin) / TURNS) * 0.72, (0.95 * len * 100) / w100);
  const copies = Math.max(1, Math.floor((0.95 * len * 100) / fs / (w100 + sep100)));
  const textW = ((copies * (w100 + sep100)) * fs) / 100;
  const flow = prog(u, 0.05, 1, easeOut);
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.15) }}>
      <svg width={L.width} height={L.height} style={{ rotate: `${(-t * 6).toFixed(2)}deg` }}>
        <path id={id} d={d} fill="none" />
        <text fontFamily={L.fontFamily} fontWeight={L.fontWeight} fontSize={fs}>
          <textPath href={`#${id}`} startOffset={mix(flow, -textW, len * 0.005)}>
            {new Array(copies).fill(0).map((_, k) => (
              <React.Fragment key={k}>
                {k > 0 ? " · " : null}
                <Spans L={L} />
              </React.Fragment>
            ))}
          </textPath>
        </text>
      </svg>
    </AbsoluteFill>
  );
};
