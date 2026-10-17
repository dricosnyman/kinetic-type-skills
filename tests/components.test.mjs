import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skill = path.join(root, "skills/kinetic-type");
const { KT_MENU } = require(path.join(skill, "assets/menu.js"));
const registry = readFileSync(path.join(skill, "remotion/index.ts"), "utf8");

// Registry keys look like:  "word-by-word-reveal": WordByWordReveal,
const registryKeys = [...registry.matchAll(/^\s*"([a-z0-9-]+)":/gm)].map((m) => m[1]);

test("every component technique in the menu is registered", () => {
  const wanted = KT_MENU.filter((e) => e.build === "component");
  assert.ok(wanted.length > 0, "no component entries found in the menu");
  const missing = wanted.filter((e) => !registryKeys.includes(e.id)).map((e) => e.id);
  assert.deepEqual(missing, [], `missing from KT_COMPONENTS: ${missing.join(", ")}`);
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

test("every example technique's file exists", () => {
  const examples = KT_MENU.filter((e) => e.build === "example");
  assert.ok(examples.length > 0, "no example entries found in the menu");
  const missing = examples.filter((e) => !e.example || !existsSync(path.join(skill, e.example))).map((e) => e.example ?? `${e.id} (no path)`);
  assert.deepEqual(missing, [], `example files missing: ${missing.join(", ")}`);
});
