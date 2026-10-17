/**
 * Family 13 — repetition, layout and loops: one text, many copies (trails,
 * stacks, tunnels, endless loops), plus fit-to-box, where the layout itself
 * moves.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). The tunnel and the
 * marquee keep moving after that (slowly): the endless loop is the technique.
 *
 * The text tunnel brings its own dark box. Fit-to-box uses Roboto Flex (the
 * variable font loaded in f05-shape-shift.tsx) because it changes the font's
 * width and weight to make the text fit.
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, easeInOut, easeOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLayout, KTLines, LWord, keyMatch, useKTLayout } from "../layout";
import type { KTProps } from "../types";
import { flex } from "./f05-shape-shift";

const inline: React.CSSProperties = { display: "inline-block" };

const plainWord = (L: KTLayout) => (w: LWord) => <span style={{ ...inline, color: w.isKey ? L.accent : L.color }}>{w.text}</span>;

const joined = (L: KTLayout) => L.words.map((w) => w.text).join(" ");

// ---------------------------------------------------------------------------
// Echo / trail: the text swoops in from the left, swings past the middle and
// comes to rest, and faded outline copies show where it was a moment earlier.
// The copies catch up and vanish once it stops. Copies are outlined in the
// accent colour; the key word is in the accent colour.

const ECHOES = 10;

export const Echo: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8 });
  const { t, settle, u } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const moveEnd = 0.65 * settle;
  const delay = Math.min(0.05, (0.3 * settle) / ECHOES);
  const at = (s: number): [number, number] => {
    const q = Math.min(1, Math.max(0, s / moveEnd));
    const e = (1 - q) * (1 - q);
    return [-Math.cos(q * Math.PI * 2.5) * e * 0.35 * L.width, Math.sin(q * Math.PI * 5) * e * 0.12 * L.height];
  };
  const stroke = Math.max(1.5, 0.012 * fs);
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.08) }}>
      {new Array(ECHOES).fill(0).map((_, j) => {
        const k = ECHOES - j; // oldest first, so the newest is on top
        const [x, y] = at(t - k * delay);
        // A copy that has come to rest sits under the text: hide it.
        const away = Math.min(1, Math.hypot(x, y) / (0.15 * fs));
        const o = (0.65 - k * 0.05) * away;
        if (o <= 0.01) return null;
        return (
          <KTLines
            key={k}
            layout={L}
            outerStyle={{ translate: `${x}px ${y}px`, opacity: o }}
            renderWord={(w) => (
              <span style={{ ...inline, color: "transparent", WebkitTextStroke: `${stroke}px ${L.accent}` }}>{w.text}</span>
            )}
          />
        );
      })}
      {(() => {
        const [x, y] = at(t);
        return <KTLines layout={L} outerStyle={{ translate: `${x}px ${y}px` }} renderWord={plainWord(L)} />;
      })()}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Outline stack: the same text stacked in outline, like plates, fanning out
// up and to the right behind the filled front copy — depth on a budget.
// A ripple runs through the plates while they fan out. The key word is in
// the accent colour, in every plate.

const PLATES = 8;
const PLATE_DX = 0.09; // em per plate
const PLATE_DY = -0.11;

export const OutlineStack: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.76, boxHeight: 0.56 });
  const { u, t } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const fan = prog(u, 0.1, 0.95, easeInOut);
  const ripple = Math.sin(fan * Math.PI);
  // Centre the whole stack, not just the front copy.
  const cx = (-PLATES * PLATE_DX * fs * fan) / 2;
  const cy = (-PLATES * PLATE_DY * fs * fan) / 2;
  const stroke = Math.max(1.5, 0.014 * fs);
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.1) }}>
      {new Array(PLATES).fill(0).map((_, j) => {
        const i = PLATES - j; // back plate first
        const wob = Math.sin(t * 6 - i * 0.5) * 0.06 * fs * ripple;
        return (
          <KTLines
            key={i}
            layout={L}
            outerStyle={{
              translate: `${cx + i * PLATE_DX * fs * fan + wob}px ${cy + i * PLATE_DY * fs * fan}px`,
              opacity: 1 - i * 0.08,
            }}
            renderWord={(w) => (
              <span style={{ ...inline, color: "transparent", WebkitTextStroke: `${stroke}px ${w.isKey ? L.accent : L.color}` }}>
                {w.text}
              </span>
            )}
          />
        );
      })}
      <KTLines layout={L} outerStyle={{ translate: `${cx}px ${cy}px` }} renderWord={plainWord(L)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Text tunnel: nested frames inside a dark box, the text running along the top
// and bottom wall of each. Every frame grows exponentially, so they seem to
// fly towards you at a steady speed, forever: fast at first, then a slow,
// readable drift. Frames alternate paper and accent; the key word takes the
// other of the two colours.

const TUNNEL_FRAMES = 7;
const TUNNEL_BG = "#1E1E24";

export const TextTunnel: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { t, settle, u } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const BW = L.width * 0.86;
  const BH = L.height * 0.62;
  const text = joined(L);
  const w100 = Math.max(1, measureText({ text, fontFamily: L.fontFamily, fontSize: 100, fontWeight: 900 }).width);
  const wallFs = Math.min(0.15 * BH, (0.92 * BW * 100) / w100);
  // Repeat a short text so the wall is full.
  const sep = measureText({ text: " · ", fontFamily: L.fontFamily, fontSize: 100, fontWeight: 900 }).width;
  const copies = Math.max(1, Math.floor((0.92 * BW * 100) / wallFs / (w100 + sep)));
  // Speed falls from 1.6 to 0.25 frames a second over the settle time; this is its running total.
  const s = Math.min(t, settle);
  const travel = 0.25 * t + 1.35 * (s - (s * s) / (2 * settle));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: prog(u, 0, 0.15) }}>
      <div style={{ position: "relative", width: BW, height: BH, overflow: "hidden", borderRadius: 0.04 * BH, background: TUNNEL_BG }}>
        {new Array(TUNNEL_FRAMES).fill(0).map((_, i) => {
          const z = (i + (travel % 1)) / TUNNEL_FRAMES; // 0 far … 1 near
          const scale = 0.06 * Math.pow(22, z); // exponential growth looks like steady motion
          const n = i - Math.floor(travel); // which frame this is, so its colour stays with it
          const col = n % 2 === 0 ? L.accent : C.paper;
          const other = col === C.paper ? L.accent : C.paper;
          const wall: React.CSSProperties = {
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: L.fontFamily,
            fontWeight: 900,
            fontSize: wallFs,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            color: col,
          };
          const line = new Array(copies).fill(0).map((__, c) => (
            <React.Fragment key={c}>
              {c > 0 ? " · " : null}
              {L.words.map((w, k) => (
                <React.Fragment key={k}>
                  {k > 0 ? " " : null}
                  <span style={{ color: w.isKey ? other : col }}>{w.text}</span>
                </React.Fragment>
              ))}
            </React.Fragment>
          ));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                scale: `${scale}`,
                border: `${4 / scale}px solid ${col}`,
                boxSizing: "border-box",
                opacity: Math.min(1, z * 2.5) * (1 - prog(z, 0.82, 1)),
              }}
            >
              <div style={{ ...wall, top: 0.06 * BH }}>{line}</div>
              <div style={{ ...wall, bottom: 0.06 * BH, rotate: "180deg" }}>{line}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Marquee / kinetic poster: three bands of the text, separated by stars,
// scroll in opposite directions and wrap around in a seamless loop (the
// position is taken modulo the width of one repeat). They rush in, then
// cruise. The middle band is on an accent strip.

export const Marquee: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { t, u } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const W = L.width;
  const fs = Math.min(0.15 * L.height, (props.fontSize ?? Math.min(W * 0.075, L.height * 0.16)) * 1.8);
  const unit = `${joined(L)} ✦ `;
  const uw = Math.max(1, measureText({ text: unit, fontFamily: L.fontFamily, fontSize: fs, fontWeight: 900 }).width);
  const copies = Math.ceil(W / uw) + 2;
  const travel = 0.08 * W * t + 0.8 * W * prog(u, 0, 1, easeOut);
  return (
    <AbsoluteFill style={{ justifyContent: "center", opacity: prog(u, 0, 0.15) }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0.04 * fs, overflow: "hidden", width: W }}>
        {[0, 1, 2].map((r) => {
          const dir = r % 2 ? 1 : -1;
          const x = ((((travel * dir) % uw) + uw) % uw) - uw;
          const strip = r === 1;
          const col = strip ? C.paper : L.color;
          const keyCol = strip ? C.ink : L.accent;
          return (
            <div key={r} style={{ background: strip ? L.accent : "transparent" }}>
              <div
                style={{
                  whiteSpace: "pre",
                  fontFamily: L.fontFamily,
                  fontWeight: 900,
                  fontSize: fs,
                  lineHeight: 1.08,
                  translate: `${x}px 0px`,
                  color: col,
                }}
              >
                {new Array(copies).fill(0).map((_, c) => (
                  <React.Fragment key={c}>
                    {L.words.map((w, k) => (
                      <React.Fragment key={k}>
                        {k > 0 ? " " : null}
                        <span style={{ color: w.isKey ? keyCol : col }}>{w.text}</span>
                      </React.Fragment>
                    ))}
                    {" ✦ "}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Fit-to-box: the text fills a rectangle exactly, edge to edge. Each line is
// sized so it spans the box's width; when the box changes shape, the font's
// width and weight sliders are re-solved (every frame) so the stacked lines
// also fill its height: a tall box gets narrow, light letters, a wide box
// gets wide, heavy ones. The key word gets its own line, in the accent colour.
// When even the widest, heaviest letters stack too tall (long text in a wide
// box), everything shrinks to fit the height, leaving space at the sides;
// when even the narrowest stack too short, there is space above and below.
//
// Extra props:
//   boxes    the box's shapes in px, played in turn over the settle time; it
//            holds the last one. Default: tall → wide → a final in-between box.
//   showBox  draw the box's outline (default true)

export type FitToBoxProps = KTProps & {
  readonly boxes?: readonly { readonly width: number; readonly height: number }[];
  readonly showBox?: boolean;
};

const MAX_LINE_CHARS = 14;
const LINE_H = 1; // each line's height, in em of its own size
const AXIS_SAMPLES = 13;

/** The font's sliders for k from 0 (narrow, light) to 1 (wide, heavy). Both widen the letters, so width grows with k. */
const axes = (k: number) => {
  const wght = Math.round(mix(k, 300, 1000));
  const wdth = mix(k, 25, 151).toFixed(1);
  return { wght, settings: `"wght" ${wght}, "wdth" ${wdth}` };
};

const lineWidth100 = (text: string, family: string, k: number) => {
  const a = axes(k);
  return measureText({ text, fontFamily: family, fontSize: 100, fontWeight: a.wght, additionalStyles: { fontVariationSettings: a.settings } })
    .width;
};

/** Groups the words into short lines; the key word gets a line of its own. */
const fitLines = (text: string, keyWord?: string) => {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const keyIndex = words.findIndex((w) => keyMatch(w, keyWord));
  const lines: { text: string; isKey: boolean }[] = [];
  let cur: string[] = [];
  const flush = () => {
    if (cur.length > 0) lines.push({ text: cur.join(" "), isKey: false });
    cur = [];
  };
  words.forEach((w, i) => {
    if (i === keyIndex) {
      flush();
      lines.push({ text: w, isKey: true });
      return;
    }
    if (cur.length > 0 && [...cur, w].join(" ").length > MAX_LINE_CHARS) flush();
    cur.push(w);
  });
  flush();
  return lines;
};

export const FitToBox: React.FC<FitToBoxProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, defaultFamily: flex });
  const { u } = useSettle();
  const family = L.fontFamily;
  const lines = useMemo(() => fitLines(props.text, props.keyWord), [props.text, props.keyWord]);
  // Each line's width at 100px for a range of slider settings (measured once).
  const table = useMemo(
    () =>
      L.ready
        ? lines.map((l) => new Array(AXIS_SAMPLES).fill(0).map((_, s) => lineWidth100(l.text, family, s / (AXIS_SAMPLES - 1))))
        : [],
    [L.ready, lines, family],
  );
  if (!L.ready || lines.length === 0) return null;

  // The box: through each shape in turn, holding the last.
  const W = L.width;
  const H = L.height;
  const shapes = props.boxes && props.boxes.length > 0
    ? props.boxes
    : [
        { width: 0.3 * W, height: 0.72 * H },
        { width: 0.84 * W, height: 0.4 * H },
        { width: 0.56 * W, height: 0.66 * H },
      ];
  const span = 0.9 / Math.max(1, shapes.length - 1);
  const seg = Math.min(shapes.length - 2, Math.floor(u / span));
  const box =
    shapes.length === 1
      ? shapes[0]
      : (() => {
          const p = prog(u, seg * span, (seg + 1) * span, easeInOut);
          return {
            width: mix(p, shapes[seg].width, shapes[seg + 1].width),
            height: mix(p, shapes[seg].height, shapes[seg + 1].height),
          };
        })();

  // Total height of the stack at slider setting k, when every line spans the box's width.
  const widthAt = (li: number, k: number) => {
    const x = k * (AXIS_SAMPLES - 1);
    const s = Math.min(AXIS_SAMPLES - 2, Math.floor(x));
    return mix(x - s, table[li][s], table[li][s + 1]);
  };
  const stackH = (k: number) => lines.reduce((a, _, li) => a + ((box.width * 100) / Math.max(1, widthAt(li, k))) * LINE_H, 0);
  // Wider letters make every line shorter, so the height falls as k grows: binary search.
  let lo = 0;
  let hi = 1;
  if (stackH(0) <= box.height) hi = 0;
  else if (stackH(1) >= box.height) lo = 1;
  else {
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (stackH(mid) > box.height) lo = mid;
      else hi = mid;
    }
  }
  const k = Math.round(((lo + hi) / 2) * 1000) / 1000;
  const a = axes(k);
  // The exact size of each line at that setting, then shrink everything if the stack still overflows.
  const sizes = lines.map((l) => (box.width * 100) / Math.max(1, lineWidth100(l.text, family, k)));
  const total = sizes.reduce((s, v) => s + v * LINE_H, 0);
  const shrink = Math.min(1, box.height / Math.max(1, total));
  const n = lines.length;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {props.showBox === false ? null : (
        <div
          style={{
            position: "absolute",
            left: (W - box.width) / 2,
            top: (H - box.height) / 2,
            width: box.width,
            height: box.height,
            outline: `${Math.max(1.5, 0.002 * W)}px solid color-mix(in srgb, ${L.color} 22%, transparent)`,
            outlineOffset: 0.006 * W,
            opacity: prog(u, 0, 0.15),
          }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: family, fontVariationSettings: a.settings }}>
        {lines.map((l, li) => {
          const at = staggerStart(li, n, 0.3, 0.06, 0.5);
          const p = prog(u, at, at + 0.3, easeOut);
          const size = sizes[li] * shrink;
          return (
            <div
              key={li}
              style={{
                fontSize: size,
                fontWeight: a.wght,
                lineHeight: `${size * LINE_H}px`,
                whiteSpace: "pre",
                color: l.isKey ? L.accent : L.color,
                opacity: p,
                translate: `0px ${mix(p, 0.3, 0) * size}px`,
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
