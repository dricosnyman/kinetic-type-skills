// Types for menu.js, so TypeScript code (the Remotion lab) can import it.

export type KTMenuEntry = {
  readonly id: string;
  readonly name: string;
  readonly aka: readonly string[];
  readonly family: number;
  readonly calm: boolean;
  readonly teach: boolean;
  readonly look: string;
  readonly reachFor: string;
  readonly build: "component" | "example" | "elsewhere";
  readonly example?: string;
  readonly isNew: boolean;
};

export type KTFamily = { readonly num: number; readonly name: string; readonly gloss: string };

export declare const KT_MENU: readonly KTMenuEntry[];
export declare const KT_FAMILIES: readonly KTFamily[];
