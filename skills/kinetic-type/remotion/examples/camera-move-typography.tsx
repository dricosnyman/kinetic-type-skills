/**
 * Example — camera-move typography (family 0).
 *
 * WHAT IT SHOWS
 * The phrases are laid out on one huge canvas, each turned 90° from the last so
 * they wind round in a loop (the next phrase starts where the last one ended).
 * A virtual camera flies from phrase to phrase, turning with them, so the text
 * always reads upright. A final phrase sits in the middle, and at the end the
 * camera pulls back to show the whole layout at once.
 *
 * HOW THE CAMERA WORKS
 * Nothing moves except one wrapper div. Its transform is
 *   translate(frame centre) scale(zoom) rotate(−camera angle) translate(−camera point)
 * which puts the camera point in the middle of the frame. The camera's point,
 * angle and zoom are interpolated between keyframes (one hold per phrase).
 *
 * HOW TO ADAPT IT
 * - Pass `phrases` (3–6 work best): the first ones wind round the loop, the
 *   last one sits in the middle. Give a phrase `accent: true` to colour it, or
 *   a `size` (px, default 120) to make it shout.
 * - Timing: each phrase gets an equal share of the first 80% of the sequence;
 *   the pull-back fills the rest. For narration, replace `at` with your own
 *   times (in design seconds, DESIGN = 10).
 * - Long phrases make a big loop; if the last arm of the loop runs into the
 *   first phrase, shorten it or raise GAP.
 */
import React from "react";
import { interpolate } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, clamp, easeInOut, mix, poppins, prog } from "../kit";
import { useFontsReady } from "../layout";
import { Canvas, DESIGN_H, DESIGN_W, useSceneTime } from "./scene";

export type CameraPhrase = { readonly text: string; readonly size?: number; readonly accent?: boolean };

export type CameraMoveProps = {
  readonly phrases?: readonly CameraPhrase[];
};

const DEFAULT_PHRASES: CameraPhrase[] = [
  { text: "Every right-angled triangle" },
  { text: "hides a secret:" },
  { text: "a² + b²", size: 170 },
  { text: "= c²", size: 170, accent: true },
  { text: "…but only for right angles.", size: 72 },
];

const DESIGN = 10; // design seconds
const GAP = 60; // px between one phrase's end and the next phrase
const LINE = 1.2; // line height in em

type Placed = CameraPhrase & {
  size: number;
  w: number;
  h: number;
  x: number; // anchor: where the phrase starts (middle of its height)
  y: number;
  rot: number; // degrees
  centred: boolean;
  cx: number; // the phrase's middle
  cy: number;
};

/** The box a placed phrase covers, as [left, top, right, bottom]. */
const extent = (q: Placed): [number, number, number, number] => {
  const across = q.rot % 180 === 0 ? q.w : q.h;
  const down = q.rot % 180 === 0 ? q.h : q.w;
  return [q.cx - across / 2, q.cy - down / 2, q.cx + across / 2, q.cy + down / 2];
};

/** The box round several phrases: its centre and size. */
const bounds = (qs: Placed[]) => {
  const e = qs.map(extent);
  const l = Math.min(...e.map((b) => b[0]));
  const tp = Math.min(...e.map((b) => b[1]));
  const r = Math.max(...e.map((b) => b[2]));
  const bt = Math.max(...e.map((b) => b[3]));
  return { x: (l + r) / 2, y: (tp + bt) / 2, w: r - l, h: bt - tp };
};

/** Lays the phrases out round a loop, the last one in the middle. */
const place = (phrases: readonly CameraPhrase[]): Placed[] => {
  const out: Placed[] = [];
  let x = 0;
  let y = 0;
  phrases.forEach((p, i) => {
    const size = p.size ?? 120;
    const w = measureText({ text: p.text, fontFamily: poppins, fontSize: size, fontWeight: 800 }).width;
    const h = size * LINE;
    const last = i === phrases.length - 1 && phrases.length > 2;
    if (last) {
      // In the middle of everything so far, upright again (the next full turn).
      const { x: cx, y: cy } = bounds(out);
      const rot = Math.ceil(out[out.length - 1].rot / 360 + 1e-6) * 360;
      out.push({ ...p, size, w, h, x: cx, y: cy, rot, centred: true, cx, cy });
      return;
    }
    const rot = i * 90;
    const d = [Math.cos((rot * Math.PI) / 180), Math.sin((rot * Math.PI) / 180)];
    if (i > 0) {
      // Start just past the previous phrase's end, turned 90° clockwise.
      const q = out[i - 1];
      const dq = [Math.cos((q.rot * Math.PI) / 180), Math.sin((q.rot * Math.PI) / 180)];
      const endX = q.x + dq[0] * q.w;
      const endY = q.y + dq[1] * q.w;
      x = endX + dq[0] * (GAP + h / 2) - d[0] * (q.h / 2);
      y = endY + dq[1] * (GAP + h / 2) - d[1] * (q.h / 2);
    }
    out.push({ ...p, size, w, h, x, y, rot, centred: false, cx: x + (d[0] * w) / 2, cy: y + (d[1] * w) / 2 });
  });
  return out;
};

export const CameraMoveTypography: React.FC<CameraMoveProps> = ({ phrases = DEFAULT_PHRASES }) => {
  const t = useSceneTime(DESIGN);
  const ready = useFontsReady(poppins, 800);
  if (!ready || phrases.length === 0) return <Canvas>{null}</Canvas>;
  const P = place(phrases);
  const n = P.length;
  const step = (0.8 * DESIGN) / n;
  const at = P.map((_, i) => 0.2 + i * step); // when each phrase appears
  const move = Math.min(0.8, 0.45 * step);

  // The overview: everything in view, upright.
  const all = bounds(P);
  const overview = { x: all.x, y: all.y, r: P[n - 1].rot, z: Math.min((0.9 * DESIGN_W) / all.w, (0.8 * DESIGN_H) / all.h) };

  // Camera keyframes: hold on each phrase, fly to the next, pull back at the end.
  const keys: { t: number; x: number; y: number; r: number; z: number }[] = [];
  P.forEach((q, i) => {
    const z = Math.min(1.5, (0.75 * DESIGN_W) / q.w, (0.45 * DESIGN_H) / q.h);
    const view = { x: q.cx, y: q.cy, r: q.rot, z };
    keys.push({ t: i === 0 ? 0 : at[i] - 0.15, ...view });
    keys.push({ t: (i < n - 1 ? at[i + 1] : at[i] + step) - 0.15 - move, ...view });
  });
  keys.push({ t: DESIGN - 0.6, ...overview });
  // interpolate needs strictly increasing times.
  for (let i = 1; i < keys.length; i++) keys[i].t = Math.max(keys[i].t, keys[i - 1].t + 0.01);
  const opts = { ...clamp, easing: easeInOut };
  const T = keys.map((k) => k.t);
  const cx = interpolate(t, T, keys.map((k) => k.x), opts);
  const cy = interpolate(t, T, keys.map((k) => k.y), opts);
  const cr = interpolate(t, T, keys.map((k) => k.r), opts);
  const cz = interpolate(t, T, keys.map((k) => k.z), opts);

  return (
    <Canvas>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${DESIGN_W / 2}px, ${DESIGN_H / 2}px) scale(${cz}) rotate(${-cr}deg) translate(${-cx}px, ${-cy}px)`,
        }}
      >
        {P.map((q, i) => {
          const a = prog(t, at[i], at[i] + 0.6);
          return (
            <div key={i} style={{ position: "absolute", left: q.x, top: q.y, rotate: `${q.rot}deg`, transformOrigin: "0 0" }}>
              <div
                style={{
                  translate: q.centred ? "-50% -50%" : "0% -50%",
                  whiteSpace: "nowrap",
                  fontSize: q.size,
                  fontWeight: 800,
                  lineHeight: LINE,
                  color: q.accent ? C.orange : q.centred ? C.teal : C.ink,
                }}
              >
                <span style={{ display: "inline-block", opacity: a, translate: `${mix(a, 80, 0)}px 0px` }}>{q.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Canvas>
  );
};
