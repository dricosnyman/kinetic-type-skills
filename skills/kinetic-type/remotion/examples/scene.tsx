/**
 * Shared by the example scenes (not a technique itself).
 *
 * Every example is drawn on a 1920 × 1080 canvas in plain pixel numbers, so
 * the positions are easy to read and change. <Canvas> scales that canvas to
 * fit whatever composition it is used in (a 9:16 frame gets it letterboxed —
 * for a vertical video, re-lay the scene instead).
 *
 * Every example is choreographed on its own clock in "design seconds"
 * (e.g. 5 s). useSceneTime stretches or squeezes that clock to the length of
 * the <Sequence> the example is placed in, so the whole scene always plays.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, poppins } from "../kit";

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export const Canvas: React.FC<{ children: React.ReactNode; background?: string }> = ({ children, background = C.paper }) => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width / DESIGN_W, height / DESIGN_H);
  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (width - DESIGN_W * s) / 2,
          top: (height - DESIGN_H * s) / 2,
          width: DESIGN_W,
          height: DESIGN_H,
          scale: `${s}`,
          transformOrigin: "0 0",
          fontFamily: poppins,
          color: C.ink,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Time in design seconds: runs 0 → `design` over the whole sequence. */
export const useSceneTime = (design: number): number => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (frame / Math.max(1, durationInFrames - 1)) * design;
};
