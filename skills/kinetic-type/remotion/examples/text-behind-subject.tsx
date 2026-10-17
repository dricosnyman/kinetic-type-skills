/**
 * Example — text behind subject (family 14, text living inside footage).
 *
 * WHAT IT SHOWS
 * A big title fills the background, and a person walks in front of it. The
 * trick is three layers, back to front: the footage, the title, then a cut-out
 * of the person (the same footage with everything but the person removed).
 * Here the person is a drawn figure.
 *
 * HOW TO ADAPT IT FOR REAL FOOTAGE
 * - Make the cut-out: rotoscope the subject (After Effects' Roto Brush,
 *   Resolve's Magic Mask, or a background-removal tool) and export it as a
 *   video with transparency (ProRes 4444 or WebM with alpha).
 * - Layers in Remotion: <OffthreadVideo src={footage} />, then the title,
 *   then <OffthreadVideo src={cutout} transparent /> on top, all the same size
 *   and in sync.
 * - Place the title where the subject will pass in front of part of it but
 *   not hide it completely; big, bold words work best.
 * - Change `title` for the word.
 */
import React from "react";
import { C, mix, prog } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type TextBehindSubjectProps = {
  readonly title?: string;
};

const DESIGN = 4; // design seconds
const BOX_W = 1400;
const BOX_H = 560;

export const TextBehindSubject: React.FC<TextBehindSubjectProps> = ({ title = "HELLO" }) => {
  const t = useSceneTime(DESIGN);
  const x = mix(prog(t, 0.3, DESIGN - 0.3, (v) => v), -200, BOX_W + 100);
  const step = Math.sin(t * 9);
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
          background: "#F6D9C4",
        }}
      >
        {/* 1. the footage (here: a plain wall and floor) */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "#D9B9A0" }} />
        {/* 2. the title */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 300,
            color: C.orange,
            paddingBottom: 60,
            opacity: prog(t, 0, 0.3),
          }}
        >
          {title}
        </div>
        {/* 3. the cut-out of the subject, on top (in real footage: a rotoscoped video with transparency) */}
        <svg style={{ position: "absolute", left: x, bottom: 0 }} width={200} height={540} viewBox="0 0 200 540">
          <circle cx={100} cy={80} r={52} fill={C.ink} />
          <rect x={52} y={140} width={96} height={220} rx={40} fill={C.ink} />
          <rect x={64} y={330} width={30} height={210} rx={14} fill={C.ink} transform={`rotate(${step * 14} 79 340)`} />
          <rect x={106} y={330} width={30} height={210} rx={14} fill={C.ink} transform={`rotate(${-step * 14} 121 340)`} />
        </svg>
      </div>
    </Canvas>
  );
};
