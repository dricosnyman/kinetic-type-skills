/**
 * Family 6 — warp and distortion: letters bend, wave and wobble, but stay the same material.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Line boil and flag wave
 * keep gently moving after that: the movement is the technique.
 */
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOut, mix, prog, useSettle } from "../kit";
import { KTLayout, KTLines, LWord, blockRect, useKTLayout, wordBoxes, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG filters (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

const plainWord = (L: KTLayout) => (w: LWord) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>;

// ---------------------------------------------------------------------------
// Line boil: a noise pattern nudges every edge, and the noise changes a few
// times a second (every 4 frames, like drawings "on twos"), so the outlines
// shiver like hand-drawn animation. The key word boils harder, in the accent colour.

export const LineBoil: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const id = useSvgId("kt-boil");
  const fs = L.fontSize;
  const seed = Math.floor(frame / 4);
  const amount = mix(prog(u, 0.2, 0.8), 0, 0.055 * fs);
  const filter = (suffix: string, scale: number) => (
    <filter id={`${id}-${suffix}`} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency={6 / fs} numOctaves={2} seed={seed} />
      <feDisplacementMap in="SourceGraphic" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {filter("w", amount)}
          {filter("k", amount * 1.8)}
        </defs>
      </svg>
      <KTLines
        layout={L}
        outerStyle={{ opacity: prog(u, 0, 0.3), scale: `${mix(prog(u, 0, 0.5), 0.94, 1)}` }}
        renderWord={(w) => (
          <span style={{ ...inline, color: wordColor(L, w), filter: `url(#${id}-${w.isKey ? "k" : "w"})` }}>{w.text}</span>
        )}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Flag wave: the text is cut into thin vertical strips, and each strip rides a
// sine wave, so the text ripples like a flag in the wind (fixed on the left,
// freer to the right). Strips on a wave's slope are shaded a little darker.
// The wave is big as the text arrives and calms to a gentle flutter.

const STRIPS = 48;

export const FlagWave: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxHeight: 0.62 });
  const { u, t } = useSettle();
  if (!L.ready) return null;
  const b = blockRect(L);
  const fs = L.fontSize;
  const amp = fs * mix(prog(u, 0.3, 1, easeInOut), 0.22, 0.1) * prog(u, 0, 0.3);
  const sw = b.w / STRIPS;
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.25) }}>
      {new Array(STRIPS).fill(0).map((_, i) => {
        const x = i / STRIPS;
        const phase = x * 9 - t * 5;
        const y = Math.sin(phase) * amp * (0.3 + x);
        const shade = 1 - 0.2 * (Math.cos(phase) * 0.5 + 0.5) * (amp / (0.22 * fs));
        // The first and last strips also reach the frame edges, so nothing is ever cut off.
        const left = i === 0 ? 0 : b.left + i * sw;
        const right = i === STRIPS - 1 ? 0 : L.width - (b.left + (i + 1) * sw + 0.5);
        return (
          <KTLines
            key={i}
            layout={L}
            outerStyle={{
              clipPath: `inset(0px ${right}px 0px ${left}px)`,
              translate: `0px ${y}px`,
              filter: `brightness(${shade})`,
            }}
            renderWord={plainWord(L)}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Bulge / magnify: a lens glides over the text, swelling whatever is under it,
// and comes to rest on the key word (or the middle of the text).

const ZOOM = 1.45;

export const Bulge: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const boxes = wordBoxes(L);
  const key = boxes.find((wb) => wb.word.isKey);
  const target = key ?? boxes[Math.floor((boxes.length - 1) / 2)];
  const R = Math.max(fs * 0.75, Math.min(fs * 1.6, (target?.w ?? fs) * 0.62));
  const endX = target?.cx ?? L.width / 2;
  const endY = target?.cy ?? L.height / 2;
  // The lens enters from the left of the text, along the target's line, with a little sway.
  const p = prog(u, 0.05, 0.92, easeInOut);
  const lx = mix(p, b.left - R * 1.2, endX);
  const ly = endY + Math.sin(p * Math.PI) * 0.25 * fs;
  const lens = `circle(${R}px at ${lx}px ${ly}px)`;
  const hole = `radial-gradient(circle ${R}px at ${lx}px ${ly}px, transparent ${R - 0.5}px, black ${R + 0.5}px)`;
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.2) }}>
      {/* The text, with a hole where the lens is. */}
      <KTLines layout={L} outerStyle={{ WebkitMaskImage: hole, maskImage: hole }} renderWord={plainWord(L)} />
      {/* Inside the lens: a bigger copy, centred on the lens. */}
      <AbsoluteFill style={{ clipPath: lens }}>
        <KTLines layout={L} outerStyle={{ transformOrigin: `${lx}px ${ly}px`, scale: `${ZOOM}` }} renderWord={plainWord(L)} />
        <AbsoluteFill style={{ background: `radial-gradient(circle ${R}px at ${lx - R * 0.3}px ${ly - R * 0.3}px, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)` }} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: lx - R,
          top: ly - R,
          width: R * 2,
          height: R * 2,
          boxSizing: "border-box",
          borderRadius: "50%",
          border: `${Math.max(3, fs * 0.05)}px solid ${L.color}`,
          boxShadow: `0 ${fs * 0.06}px ${fs * 0.2}px rgba(0,0,0,0.15)`,
        }}
      />
    </AbsoluteFill>
  );
};
