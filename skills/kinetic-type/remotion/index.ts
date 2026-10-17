/**
 * KT_COMPONENTS: one Remotion component per technique, keyed by menu id
 * (skills/kinetic-type/assets/menu.js). Every menu entry with build "component" is here.
 *
 * Use one inside a <Sequence>; it animates from the sequence's first frame:
 *   const Comp = KT_COMPONENTS["word-by-word-reveal"];
 *   <Sequence from={90} durationInFrames={120}><Comp text="..." keyWord="..." /></Sequence>
 */
import type React from "react";
import type { KTProps } from "./types";
import {
  EmphasisScaling,
  Extrusion3D,
  FluidTypography,
  Glitch,
  MarkerHighlight,
  MaskingAndReveals,
  MotionTypography,
  PhysicsBased,
  Typewriter,
  WordByWordReveal,
} from "./families/f00-basics";
import { Cascade, FlipIn3D, RandomOrderPopOn, SimpleFade, Stomp, TrackingIn, Wave } from "./families/f01-choreography";

export type { KTProps } from "./types";

export const KT_COMPONENTS: Record<string, React.FC<KTProps>> = {
  // Family 0: the basics
  "motion-typography": MotionTypography,
  "fluid-typography": FluidTypography,
  "word-by-word-reveal": WordByWordReveal,
  "emphasis-scaling": EmphasisScaling,
  "marker-highlight": MarkerHighlight,
  "physics-based": PhysicsBased,
  "typewriter": Typewriter,
  "glitch": Glitch,
  "masking-and-reveals": MaskingAndReveals,
  "3d-extrusion": Extrusion3D,
  // Family 1: letter choreography
  "cascade": Cascade,
  "random-order-pop-on": RandomOrderPopOn,
  "wave": Wave,
  "3d-flip-in": FlipIn3D,
  "tracking-in": TrackingIn,
  "simple-fade": SimpleFade,
  "stomp": Stomp,
};
