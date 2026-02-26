import test from "node:test";
import assert from "node:assert/strict";

import { containsDevanagari, romanizeDevanagari, validateRomanizedLatin } from "@/lib/romanize";

test("romanizes Shri and title-cases by default", () => {
  assert.equal(
    romanizeDevanagari("श्रीगुरु चरन सरोज रज"),
    "Shri Guru Charan Saroj Raj",
  );
});

test("can skip title case", () => {
  assert.equal(romanizeDevanagari("राम", { titleCase: false }), "raam");
});

test("validator flags remaining Devanagari", () => {
  const result = validateRomanizedLatin("Shri Guru राम");
  assert.equal(result.hasDevanagari, true);
  assert.deepEqual(result.offendingCharacters, ["र", "ा", "म"]);
  assert.equal(containsDevanagari("Latin राम"), true);
});
