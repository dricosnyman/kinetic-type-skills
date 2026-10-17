/**
 * Family 15 — text driven by sound: words appear, change colour or punch
 * exactly on the syllable or the beat.
 *
 * There is no audio here. Captions and karaoke follow word times: pass
 * `wordTimes` (seconds from the start of the sequence when each word is said,
 * e.g. from the director's timing estimate); without them the words are spread
 * evenly over the sequence. Beat pulse follows `bpm`, or exact `beats`.
 *
 * Their identity is pacing over time, so they are not all on screen by u = 1:
 * each word is readable as soon as it is said, the beat punch decays within a
 * quarter of a second, and the last frame shows the end of the line, readable.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, mix, pop, prog, useSettle } from "../kit";
import { KTLines, useKTLayout } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

export type SpokenProps = KTProps & {
  /** Seconds from the start of the sequence when each word is said. Default: spread evenly over the sequence. */
  readonly wordTimes?: readonly number[];
};

/** When each of n words starts, in seconds: the given times, or an even spread from `from` to `to` of the sequence. */
const startTimes = (n: number, dur: number, given: readonly number[] | undefined, from: number, to: number): number[] =>
  new Array(n).fill(0).map((_, i) => given?.[i] ?? mix(n <= 1 ? 0 : i / (n - 1), from * dur, to * dur));

// ---------------------------------------------------------------------------
// Word-highlight captions: two or three words at a time (a group ends early
// at punctuation), big and bold with a thick outline so they read over any
// footage. Each word appears as it is said; the word being said pops bigger,
// tilts and turns yellow — or the accent colour for the key word.

const CAPTION_STROKE = 0.07; // outline width in em
const CAPTION_GAP = 0.3; // space between words in em
const CAPTION_POP = 0.12; // how much bigger the word being said gets (it grows in its line, pushing the others aside)

export const WordHighlightCaptions: React.FC<SpokenProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { t, dur } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const words = L.words;
  // Groups of up to three words.
  const groups: number[][] = [];
  let cur: number[] = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (cur.length === 3 || /[.,!?;:]["'”’)]*$/.test(w.text)) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length > 0) groups.push(cur);
  const at = startTimes(words.length, dur, props.wordTimes, 0, 0.75);
  const active = at.reduce((a, s, i) => (t >= s ? i : a), 0);
  const group = groups.find((g) => g.includes(active)) ?? groups[0];
  // One size for every group: the biggest at which the widest group fits on one line.
  const widest = Math.max(
    ...groups.map(
      (g) =>
        g.reduce((a, i) => a + measureText({ text: words[i].text, fontFamily: L.fontFamily, fontSize: 100, fontWeight: 900 }).width, 0) +
        (g.length - 1) * CAPTION_GAP * 100,
    ),
  );
  // The popped word grows (and overshoots a little); the outline sticks out too.
  const fs = Math.min(1.25 * L.fontSize, (0.8 * L.width * 100) / Math.max(1, widest * (1 + 1.5 * CAPTION_POP) + 2 * CAPTION_STROKE * 100));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: `0 ${CAPTION_GAP * fs}px`, fontFamily: L.fontFamily, fontWeight: 900, fontSize: fs, lineHeight: 1.2 }}>
        {group.map((i) => {
          const w = words[i];
          const on = i === active;
          const p = pop(t, at[i], 0.25, 3);
          return (
            <span
              key={i}
              style={{
                ...inline,
                whiteSpace: "pre",
                color: on ? (w.isKey ? L.accent : C.marker) : w.isKey ? L.accent : "#FFFFFF",
                WebkitTextStroke: `${CAPTION_STROKE * fs}px #000000`,
                paintOrder: "stroke fill",
                fontSize: on ? `${mix(p, 1, 1 + CAPTION_POP)}em` : "1em",
                rotate: on ? "-3deg" : "0deg",
                opacity: t >= at[i] - 0.02 || i < active ? 1 : 0,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Karaoke sweep: the whole line is visible in a pale tint, and colour sweeps
// through each word, left to right, exactly while it is sung (longer words
// take longer by default). Blue unless a colour is given; the key word fills
// with the accent colour.

export const KaraokeSweep: React.FC<SpokenProps> = (props) => {
  const sung = props.color ?? C.blue;
  const L = useKTLayout({ ...props, color: sung }, { fontWeight: 800 });
  const { t, dur } = useSettle();
  // Default timing: the line's window (10%–85% of the sequence) shared out by word length.
  const weights = L.words.map((w) => w.letters.length + 1);
  const total = Math.max(1, weights.reduce((a, b) => a + b, 0));
  const cum = weights.reduce((a, wt) => [...a, a[a.length - 1] + wt], [0]);
  const evenly = (i: number) => mix(cum[i] / total, 0.1 * dur, 0.85 * dur);
  const given = props.wordTimes;
  const spans = L.words.map((_, i) => {
    const a = given?.[i] ?? evenly(i);
    const b = given?.[i + 1] ?? (given ? a + 0.4 : evenly(i + 1));
    return { a, b: Math.max(a + 0.05, b) };
  });
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(t, 0, 0.15) }}
      renderWord={(w) => {
        const fill = prog(t, spans[w.index].a, spans[w.index].b, (x) => x);
        const c = w.isKey ? L.accent : L.color;
        return (
          <span style={{ ...inline, position: "relative" }}>
            <span style={{ color: `color-mix(in srgb, ${c} 24%, transparent)` }}>{w.text}</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                whiteSpace: "pre",
                color: c,
                clipPath: `inset(-20% ${(100 - fill * 100).toFixed(2)}% -20% 0%)`,
              }}
            >
              {w.text}
            </span>
          </span>
        );
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Beat pulse: the text punches on every beat — it jumps bigger and spreads its
// letters, then eases back within a quarter of a second. How hard it punches
// follows the loudness: the first beat of every bar of four is the loudest.
// The key word punches hardest (it grows within its line, pushing its
// neighbours aside), in the accent colour. The first beat lands on
// the sequence's first frame, so the text arrives on a punch.
//
// Extra props: bpm (default 120), or beats (exact beat times in seconds).

export type BeatProps = KTProps & {
  readonly bpm?: number;
  readonly beats?: readonly number[];
};

export const BeatPulse: React.FC<BeatProps> = (props) => {
  // Room is left for the punch.
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.66, boxHeight: 0.56 });
  const { t, dur } = useSettle();
  const step = 60 / Math.max(1, props.bpm ?? 120);
  const beats = props.beats ?? new Array(Math.ceil(dur / step) + 1).fill(0).map((_, i) => i * step);
  let last = -1;
  beats.forEach((b, i) => {
    if (b <= t) last = i;
  });
  const loud = last < 0 ? 0 : last % 4 === 0 ? 1 : 0.6;
  const kick = last < 0 ? 0 : loud * Math.exp(-(t - beats[last]) * 9);
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(t, 0, 0.05), scale: `${1 + kick * 0.16}` }}
      renderWord={(w) => (
        <span
          style={{
            ...inline,
            color: w.isKey ? L.accent : L.color,
            // Size and spacing change the word's width, so the line makes room (scaling would overlap).
            fontSize: `${1 + (w.isKey ? kick * 0.2 : 0)}em`,
            letterSpacing: `${kick * 0.04}em`,
          }}
        >
          {w.text}
        </span>
      )}
    />
  );
};
