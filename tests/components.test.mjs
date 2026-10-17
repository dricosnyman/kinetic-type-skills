import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Families whose components exist so far. Task 6 removes this filter.
const IMPLEMENTED_FAMILIES = [0, 1];

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { KT_MENU } = require(path.join(root, "skills/kinetic-type/assets/menu.js"));
const registry = readFileSync(path.join(root, "skills/kinetic-type/remotion/index.ts"), "utf8");

// Registry keys look like:  "word-by-word-reveal": WordByWordReveal,
const registryKeys = [...registry.matchAll(/^\s*"([a-z0-9-]+)":/gm)].map((m) => m[1]);

test("every component technique in the implemented families is registered", () => {
  const wanted = KT_MENU.filter((e) => e.build === "component" && IMPLEMENTED_FAMILIES.includes(e.family));
  assert.ok(wanted.length > 0, "no component entries found in the implemented families");
  for (const e of wanted) assert.ok(registryKeys.includes(e.id), `missing from KT_COMPONENTS: "${e.id}":`);
});

test("every registry key is a component in the menu", () => {
  assert.ok(registryKeys.length > 0, "no registry keys found");
  const byId = new Map(KT_MENU.map((e) => [e.id, e]));
  for (const key of registryKeys) {
    assert.ok(byId.has(key), `"${key}" is not a menu id`);
    assert.equal(byId.get(key).build, "component", `"${key}" is not build: "component" in the menu`);
  }
});

test("registry keys are unique", () => {
  assert.equal(new Set(registryKeys).size, registryKeys.length, "duplicate registry key");
});
