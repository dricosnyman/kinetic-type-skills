/**
 * Family 4 — characters that change in place: each letter keeps its slot,
 * but what is in the slot changes.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Each slot is as wide as
 * its real letter (an invisible copy holds the space), so changing characters
 * never push the line around, whatever the font.
 */
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { C, courier, easeInOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLines, letterWidths, useKTLayout, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "#$%&@*!?+=<>/";

/** The set of characters a slot cycles through: same kind as its real letter. */
const setFor = (ch: string): string =>
  UPPER.includes(ch) ? UPPER : LOWER.includes(ch) ? LOWER : DIGITS.includes(ch) ? DIGITS : ch.toLocaleLowerCase() !== ch.toLocaleUpperCase() ? (ch === ch.toLocaleUpperCase() ? UPPER : LOWER) : SYMBOLS;

const pick = (set: string, seed: string) => set[Math.floor(random(seed) * set.length)];

// ---------------------------------------------------------------------------
// Scramble / decode: random characters flicker in every slot, then lock into
// the real letters one by one. The key word locks last, in the accent colour.
// Typed in Courier Prime unless a font is given (the classic "hacker" look).

export const Scramble: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 700, defaultFamily: courier });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const N = L.letterCount;
  // Lock order: the other words left to right, then the key word.
  const rank = useMemo(() => {
    const order: number[] = [];
    for (const key of [false, true])
      for (const w of L.words) if (w.isKey === key) w.letters.forEach((_, j) => order.push(w.letterStart + j));
    const r = new Array<number>(N);
    order.forEach((gi, k) => (r[gi] = k));
    return r;
  }, [L.words, N]);
  const step = Math.floor(frame / 2); // a new random character every 2 frames
  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline, color: wordColor(L, w) }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const locked = u >= mix((rank[gi] + 1) / N, 0.2, 0.95);
            return (
              <span key={j} style={{ ...inline, position: "relative" }}>
                <span style={{ visibility: locked ? "visible" : "hidden" }}>{ch}</span>
                {!locked && u >= 0.04 ? (
                  <span style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", color: C.muted }}>
                    {pick(setFor(ch), `kt-scr${gi}-${step}`)}
                  </span>
                ) : null}
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Odometer / rolling digits: every character is a little window with a strip
// rolling behind it. Digits roll through 0–9 on dark wheels, like a car's
// mileage counter; letters roll through the alphabet like a slot machine.
// Slots further right roll longer; the key word rolls longest, in the accent colour.

const SLOT_H = 1.2; // window height, in em

export const Odometer: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, lineHeight: 1.3 });
  const { u } = useSettle();
  return (
    <KTLines
      layout={L}
      // Every slot is a fixed-height window, so lines line up by their tops (not their text baselines).
      lineStyle={() => ({ alignItems: "flex-start" })}
      renderWord={(w) => (
        <span style={{ display: "inline-flex", color: wordColor(L, w) }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const digit = DIGITS.includes(ch);
            const rolls = setFor(ch) !== SYMBOLS;
            const n = w.letters.length;
            const end = w.isKey ? 0.95 : mix(n > 1 ? j / (n - 1) : 1, 0.55, 0.85);
            const total = (digit ? 20 : 8) + j * 2 + (w.isKey ? 6 : 0); // characters the strip rolls past
            const p = prog(u, 0.05, end, easeInOut);
            const pos = p * total;
            const cellAt = (k: number): string => {
              if (k >= total) return ch;
              if (digit) return DIGITS[(((Number(ch) - (total - k)) % 10) + 10) % 10];
              return pick(setFor(ch), `kt-odo${gi}-${k}`);
            };
            const k0 = Math.floor(pos);
            return (
              <span
                key={j}
                style={{
                  ...inline,
                  position: "relative",
                  overflow: "hidden",
                  verticalAlign: "top",
                  height: `${SLOT_H}em`,
                  lineHeight: `${SLOT_H}em`,
                  opacity: prog(u, 0, 0.15),
                }}
              >
                {digit ? (
                  <span style={{ position: "absolute", inset: "0.04em 0.02em", borderRadius: "0.1em", background: C.ink }} />
                ) : null}
                <span style={{ visibility: "hidden" }}>{ch}</span>
                {rolls
                  ? [k0, k0 + 1].map((k) => (
                      <span
                        key={k}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          top: `${(k - pos) * SLOT_H}em`,
                          color: digit ? C.paper : undefined,
                        }}
                      >
                        {k <= total ? cellAt(k) : ""}
                      </span>
                    ))
                  : <span style={{ position: "absolute", left: 0, top: 0 }}>{ch}</span>}
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Split-flap board: every character is a hinged card, like an airport
// departures board. Each card flips through a few characters before landing
// on its own. Light letters on dark cards; the key word's letters are in the
// accent colour. Courier Prime unless a font is given.

const CARD = "#2A2B33";
const CARD_H = 1.12; // card height, in em
const CARD_PAD = 0.08; // space inside the card on each side, in em
const CARD_GAP = 0.06; // space between cards, in em

export const SplitFlapBoard: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, {
    fontWeight: 700,
    defaultFamily: courier,
    lineHeight: 1.35,
    // The layout measures each letter plus its card's padding and gap.
    letterSpacing: 2 * CARD_PAD + CARD_GAP,
  });
  const { u } = useSettle();
  const N = L.letterCount;
  const ink = props.color ?? C.paper;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const set = setFor(ch);
            const flips = 4 + Math.floor(random(`kt-flap${gi}`) * 6);
            const goal = set.indexOf(ch);
            // The characters this card shows, ending on its own.
            const charAt = (k: number) =>
              k >= flips ? ch : goal >= 0 ? set[(((goal - (flips - k)) % set.length) + set.length) % set.length] : pick(set, `kt-fl${gi}-${k}`);
            const a = staggerStart(gi, N, 0.6, 0.03, 0.95);
            const f = prog(u, a, a + 0.6, (x) => x) * flips;
            const idx = Math.min(flips, Math.floor(f));
            const frac = f - idx;
            const done = idx >= flips;
            const prev = charAt(idx);
            const next = done ? prev : charAt(idx + 1);
            const color = w.isKey ? L.accent : ink;
            const half = (top: boolean, c: string, style?: React.CSSProperties) => (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: top ? 0 : "50%",
                  height: "50%",
                  overflow: "hidden",
                  background: CARD,
                  borderRadius: top ? "0.08em 0.08em 0 0" : "0 0 0.08em 0.08em",
                  ...style,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: top ? 0 : "-100%",
                    height: "200%",
                    lineHeight: `${CARD_H}em`,
                    textAlign: "center",
                    color,
                  }}
                >
                  {c}
                </span>
              </span>
            );
            return (
              <span
                key={j}
                style={{
                  ...inline,
                  position: "relative",
                  verticalAlign: "top",
                  height: `${CARD_H}em`,
                  lineHeight: `${CARD_H}em`,
                  padding: `0 ${CARD_PAD}em`,
                  marginRight: `${CARD_GAP}em`,
                  opacity: prog(u, Math.max(0, a - 0.1), a + 0.02),
                }}
              >
                <span style={{ visibility: "hidden" }}>{ch}</span>
                {/* Behind: the top already shows the next character, the bottom still the old one. */}
                {half(true, next)}
                {half(false, prev)}
                {/* The moving flap: the old top half falls, then becomes the new bottom half. */}
                {!done && frac < 0.5
                  ? half(true, prev, { transformOrigin: "50% 100%", transform: `perspective(4em) rotateX(${-frac * 180}deg)` })
                  : null}
                {!done && frac >= 0.5
                  ? half(false, next, { transformOrigin: "50% 0%", transform: `perspective(4em) rotateX(${(1 - frac) * 180}deg)` })
                  : null}
                <span style={{ position: "absolute", left: 0, right: 0, top: "calc(50% - 0.012em)", height: "0.024em", background: C.night }} />
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Anagram / letter rearrange: every word starts with its letters shuffled
// (an anagram of itself), then the letters glide in arcs to their real places.
// The key word's letters jump higher, in the accent colour.

export const Anagram: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const n = L.words.length;
  // For each word: how far each letter starts from its real place, in px.
  const offsets = useMemo(() => {
    if (!L.ready) return L.words.map((w) => w.letters.map(() => 0));
    return L.words.map((w) => {
      const widths = letterWidths(L, w);
      const m = w.letters.length;
      let perm = w.letters.map((_, j) => j).sort((a, b) => random(`kt-ana${w.index}-${a}`) - random(`kt-ana${w.index}-${b}`));
      // Make sure the word really is shuffled (and not just the same letters in the same order).
      if (m > 1 && perm.every((p, j) => w.letters[p] === w.letters[j])) perm = perm.map((_, j) => (j + 1) % m);
      const at = (order: number[]) => {
        const x = new Array<number>(m);
        let acc = 0;
        for (const j of order) {
          x[j] = acc;
          acc += widths[j];
        }
        return x;
      };
      const home = at(w.letters.map((_, j) => j));
      const start = at(perm);
      return w.letters.map((_, j) => start[j] - home[j]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only depends on these parts of the layout
  }, [L.ready, L.words, L.fontSize, L.fontFamily, L.fontWeight]);
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(u, 0, 0.12) }}
      renderWord={(w) => {
        const a = 0.15 + staggerStart(w.index, n, 0.55, 0.08, 0.8);
        const p = prog(u, a, a + 0.55, easeInOut);
        return (
          <span style={{ ...inline, color: wordColor(L, w) }}>
            {w.letters.map((ch, j) => {
              const lift = Math.sin(p * Math.PI) * (j % 2 ? 0.45 : -0.45) * (w.isKey ? 1.4 : 1);
              return (
                <span key={j} style={{ ...inline, translate: `${(1 - p) * offsets[w.index][j]}px ${lift}em` }}>
                  {ch}
                </span>
              );
            })}
          </span>
        );
      }}
    />
  );
};
