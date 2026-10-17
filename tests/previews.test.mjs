import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { KT_MENU } = require(path.join(root, "skills/kinetic-type/assets/menu.js"));
const { KT_PREVIEWS, KT } = require(path.join(root, "skills/kinetic-type/assets/previews.js"));

const LONG =
  "Every right-angled triangle hides a secret that the ancient Greeks wrote down, and today we still use it to measure the world around us.";
const LINES = [
  { text: "Gerald sê: nee! a² + b² = c²", key: "nee" },
  { text: "Every right-angled triangle hides a secret.", key: "secret" },
  { text: LONG, key: "secret" },
  { text: "x", key: "missing" },
  { text: "", key: "" },
  { text: "<b>bold</b> & \"quotes\"", key: "bold" },
];

test("every menu id has a preview", () => {
  const missing = KT_MENU.map((e) => e.id).filter((id) => !KT_PREVIEWS[id]);
  assert.deepEqual(missing, []);
});

test("every preview has build and tick, or is static", () => {
  for (const [id, p] of Object.entries(KT_PREVIEWS)) {
    if (p.static === true) continue;
    assert.equal(typeof p.build, "function", `${id}.build`);
    assert.equal(typeof p.tick, "function", `${id}.tick`);
  }
});

test("there are no previews for ids that are not on the menu", () => {
  const ids = new Set(KT_MENU.map((e) => e.id));
  assert.deepEqual(Object.keys(KT_PREVIEWS).filter((id) => !ids.has(id)), []);
});

test("build keeps Afrikaans and maths characters", () => {
  for (const [id, p] of Object.entries(KT_PREVIEWS)) {
    if (p.static) continue;
    const html = p.build({ text: "Gerald sê: nee! a² + b² = c²", key: "nee" });
    assert.equal(typeof html, "string", id);
    assert.ok(html.includes("sê"), `${id} lost "sê"`);
    assert.ok(html.includes("²"), `${id} lost "²"`);
  }
});

test("build works for a missing key, an empty line and a 24-word line", () => {
  for (const [id, p] of Object.entries(KT_PREVIEWS)) {
    if (p.static) continue;
    for (const line of LINES) assert.doesNotThrow(() => p.build(line), `${id}: ${JSON.stringify(line.text)}`);
  }
});

test("build escapes HTML in the text", () => {
  for (const [id, p] of Object.entries(KT_PREVIEWS)) {
    if (p.static) continue;
    const html = p.build({ text: "<b>bold</b> & more", key: "" });
    assert.ok(!html.includes("<b>bold"), `${id} did not escape the text`);
  }
});

test("only the first key-word match is highlighted", () => {
  const line = { text: "The secret is a secret, secret.", key: "secret" };
  for (const id of ["word-by-word-reveal", "marker-highlight", "emphasis-scaling", "simple-fade"]) {
    const html = KT_PREVIEWS[id].build(line);
    assert.equal(html.split("data-key").length - 1, 1, `${id} highlights more than one word`);
  }
});

test("KT.keyMatch ignores punctuation and case, whole word only", () => {
  assert.equal(KT.keyMatch("secret.", "secret"), true);
  assert.equal(KT.keyMatch("Secrets", "secret"), false);
  assert.equal(KT.keyMatch("SECRET!", "secret"), true);
  assert.equal(KT.keyMatch("“nee!”", "nee"), true);
  assert.equal(KT.keyMatch("(c²)", "c²"), true);
  assert.equal(KT.keyMatch("secret", ""), false);
  assert.equal(KT.keyMatch("secret", undefined), false);
  assert.equal(KT.keyMatch("...", "!"), false);
});

test("KT.fit is a function and the loop constants are exported", () => {
  assert.equal(typeof KT.fit, "function");
  assert.equal(KT.LOOP, 3.4);
  assert.equal(KT.REST, 2.3);
});
