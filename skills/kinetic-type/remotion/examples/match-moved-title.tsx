/**
 * Example — match-moved title (family 14, text living inside footage).
 *
 * WHAT IT SHOWS
 * A title that sits at its own depth inside a scene, so it moves exactly with
 * the camera, as if it were really there. Here the "footage" is drawn: a far
 * row of buildings, the title, and a near row of buildings. The camera pans;
 * each layer moves by an amount set by its depth (near things move more —
 * parallax), and the title moves like a layer between the two rows.
 *
 * HOW TO ADAPT IT FOR REAL FOOTAGE
 * - Track the shot first (After Effects' 3D camera tracker, Blender, or
 *   Resolve/Fusion) and export the camera's movement as keyframes per frame:
 *   for a flat move, x/y position and scale of a point at the title's depth.
 * - Put the footage underneath (<OffthreadVideo> or <Video>), then the title
 *   in a div whose translate/scale come from those keyframes instead of `layer()`.
 * - If something in the footage passes in front of the title, you also need a
 *   cut-out of it on top (see text-behind-subject.tsx).
 * - Without tracking data, only use this on a still image or a smooth pan you
 *   can match by eye, as below.
 */
import React from "react";
import { random } from "remotion";
import { C, easeInOut, mix, prog } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type MatchMovedTitleProps = {
  readonly title?: string;
};

const DESIGN = 4; // design seconds
const BOX_W = 1400;
const BOX_H = 560;

const Buildings: React.FC<{ seed: string; n: number; color: string; minH: number; maxH: number; w: number }> = ({
  seed,
  n,
  color,
  minH,
  maxH,
  w,
}) => (
  <>
    {new Array(n).fill(0).map((_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: i * w,
          bottom: 0,
          width: w - 14,
          height: minH + random(`${seed}${i}`) * (maxH - minH),
          background: color,
          borderRadius: "6px 6px 0 0",
        }}
      />
    ))}
  </>
);

export const MatchMovedTitle: React.FC<MatchMovedTitleProps> = ({ title = "DOWNTOWN" }) => {
  const t = useSceneTime(DESIGN);
  const cam = prog(t, 0, DESIGN, easeInOut);
  // A layer at `depth` (0 = infinitely far, 1 = nearest) moves by depth × the camera move.
  const layer = (depth: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 4000,
    height: BOX_H,
    translate: `${-cam * 900 * depth}px ${cam * 40 * depth}px`,
    scale: `${1 + cam * 0.15 * depth}`,
    transformOrigin: "50% 100%",
  });
  return (
    <Canvas>
      <div
        style={{
          position: "absolute",
          left: (1920 - BOX_W) / 2,
          top: (1080 - BOX_H) / 2,
          width: BOX_W,
          height: BOX_H,
          overflow: "hidden",
          borderRadius: 24,
          background: "#BFD9E8",
        }}
      >
        <div style={layer(0.3)}>
          <Buildings seed="far" n={30} color="#9DBBD0" minH={220} maxH={420} w={140} />
        </div>
        <div style={layer(0.6)}>
          <div
            style={{
              position: "absolute",
              left: 420,
              bottom: 150,
              fontWeight: 900,
              fontSize: 210,
              color: C.orange,
              whiteSpace: "nowrap",
              textShadow: "0 12px 0 rgba(0,0,0,0.12)",
              opacity: mix(prog(t, 0, 0.4), 0, 1),
            }}
          >
            {title}
          </div>
        </div>
        <div style={layer(1)}>
          <Buildings seed="near" n={24} color="#3E4A61" minH={90} maxH={330} w={230} />
        </div>
      </div>
    </Canvas>
  );
};
