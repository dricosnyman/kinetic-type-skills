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
import { Knockout, Shred, Slice, ZoomThroughLetter } from "./families/f02-cuts";
import { Disintegrate, ParticleAssemble, Shatter } from "./families/f03-break";
import { Anagram, Odometer, Scramble, SplitFlapBoard } from "./families/f04-in-place";
import { Construction, OutlineMorph, VariableFontBreathing, WidthStretch } from "./families/f05-shape-shift";
import { Bulge, FlagWave, LineBoil } from "./families/f06-warp";
import { LightSweep, LongShadow, NeonSign, SpotlightReveal, StrokeWriteOn } from "./families/f07-light";
import { InkBleed, LiquidFill, SmokeDissolve, WaterReflection } from "./families/f08-elements";

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
  // Family 2: cuts, slices and masks
  "slice": Slice,
  "shred": Shred,
  "knockout": Knockout,
  "zoom-through-a-letter": ZoomThroughLetter,
  // Family 3: breaking apart and building up
  "shatter": Shatter,
  "disintegrate": Disintegrate,
  "particle-assemble": ParticleAssemble,
  // Family 4: characters that change in place
  "scramble": Scramble,
  "odometer": Odometer,
  "split-flap-board": SplitFlapBoard,
  "anagram": Anagram,
  // Family 5: shape-shifting letters
  "variable-font-breathing": VariableFontBreathing,
  "width-stretch": WidthStretch,
  "construction": Construction,
  "outline-morph": OutlineMorph,
  // Family 6: warp and distortion
  "line-boil": LineBoil,
  "flag-wave": FlagWave,
  "bulge": Bulge,
  // Family 7: line, light and shadow
  "stroke-write-on": StrokeWriteOn,
  "neon-sign": NeonSign,
  "light-sweep": LightSweep,
  "long-shadow": LongShadow,
  "spotlight-reveal": SpotlightReveal,
  // Family 8: elemental materials
  "liquid-fill": LiquidFill,
  "ink-bleed": InkBleed,
  "water-reflection": WaterReflection,
  "smoke-dissolve": SmokeDissolve,
};
