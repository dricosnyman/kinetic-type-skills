/**
 * Timing helpers, fonts and colours shared by every kinetic type component.
 * Ported from the showcase videos' common.tsx (without the scene frame and sound effects).
 */
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";

const poppinsFont = loadPoppins("normal", {
  weights: ["400", "600", "800", "900"],
  subsets: ["latin", "latin-ext"],
});
const courierFont = loadCourier("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "latin-ext"],
});

export const poppins = poppinsFont.fontFamily;
/** Typewriter face. */
export const courier = courierFont.fontFamily;
/** Resolves once the bundled fonts have loaded (measure text only after this). */
export const bundledFontsLoaded = (): Promise<unknown> =>
  Promise.all([poppinsFont.waitUntilDone(), courierFont.waitUntilDone()]);

export const C = {
  paper: "#F4EFE6",
  ink: "#1E1E24",
  muted: "#8A8578",
  faint: "#D9D2C3",
  orange: "#F2643D",
  teal: "#2A9D8F",
  yellow: "#F4B942",
  marker: "#FFE14D",
  blue: "#3D6CF2",
  night: "#0E0F14",
  glitchRed: "#FF2A4D",
  glitchCyan: "#00E5FF",
};

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** Current time inside the sequence, in seconds. */
export const useT = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** 0 → 1 between time a and time b. If b is not after a, it simply jumps from 0 to 1 at a. */
export const prog = (t: number, a: number, b: number, easing: (x: number) => number = easeOut): number =>
  b > a ? interpolate(t, [a, b], [0, 1], { ...clamp, easing }) : t >= a ? 1 : 0;

/** Springy 0 → 1 (overshoots a little) starting at `at`. */
export const pop = (t: number, at: number, dur = 0.45, overshoot = 2.2): number =>
  interpolate(t, [at, at + dur], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(overshoot)),
  });

export const mix = (p: number, a: number, b: number): number => a + (b - a) * p;

/**
 * The settle clock. Every component must be fully arrived within
 * min(1 s, 60% of its sequence). Components animate on `u`, which runs
 * 0 → 1 over that settle time (and keeps going past 1 afterwards).
 *   t      seconds since the sequence started
 *   settle settle time in seconds
 *   u      t / settle
 *   dur    sequence length in seconds
 */
export const useSettle = (): { t: number; settle: number; u: number; dur: number } => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const dur = durationInFrames / fps;
  // End one frame early so the last frame of a short clip is already settled.
  const settle = Math.max(1 / fps, Math.min(1, 0.6 * dur - 1 / fps));
  const t = frame / fps;
  return { t, settle, u: t / settle, dur };
};

/**
 * The exit clock, for techniques that destroy the text (shatter, dust, smoke,
 * zoom through a letter). The text is readable by the settle time and holds;
 * the destruction plays over the last part of the sequence and is finished
 * on its last frame.
 *   t, settle, u, dur  as useSettle gives them (the text arrives on u)
 *   out    0 → 1 over the exit: it starts at max(settle, dur − exitLen),
 *          where exitLen = min(maxLen seconds, share of the sequence)
 */
export const useExit = (maxLen = 1.4, share = 0.45): { t: number; settle: number; u: number; dur: number; out: number } => {
  const s = useSettle();
  const { fps } = useVideoConfig();
  const end = s.dur - 1 / fps; // time of the last frame
  const start = Math.min(Math.max(s.settle, end - Math.min(maxLen, share * s.dur)), end - 1e-3);
  return { ...s, out: prog(s.t, start, end, (x) => x) };
};

/**
 * Start time (in u) of item i of n, when each item's own move lasts `len`
 * and everything has to be done by u = end. Items start `maxStep` apart,
 * or closer together when there are too many to fit.
 */
export const staggerStart = (i: number, n: number, len: number, maxStep: number, end = 1): number => {
  if (n <= 1) return 0;
  const step = Math.min(maxStep, Math.max(0, end - len) / (n - 1));
  return i * step;
};
