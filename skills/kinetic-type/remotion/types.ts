/**
 * Props every kinetic type component takes.
 *
 * A component renders `text` centred on a transparent background (the scene
 * supplies the background), wrapping onto more lines when it is long.
 * It animates from frame 0 of its <Sequence> and settles within
 * min(1 s, 60% of the sequence), so even a 20-frame clip ends readable.
 */
export type KTProps = {
  readonly text: string;
  /** One word to give the technique's accent treatment. Punctuation is ignored; first match only; a missing word is fine. */
  readonly keyWord?: string;
  /** Default Poppins (loaded in kit.ts). Load any other font yourself before using it. */
  readonly fontFamily?: string;
  /** Default ink #1E1E24. */
  readonly color?: string;
  /** Default orange #F2643D. */
  readonly accent?: string;
  /** Default fits the composition width. A given size is the largest used: long text still shrinks to fit the frame. */
  readonly fontSize?: number;
};
