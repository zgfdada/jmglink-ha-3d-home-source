import test from "node:test";
import assert from "node:assert/strict";
import { ShaderMaterial, UniformsUtils } from "three";
import {
  DEFAULT_OUTLINE_SCALE,
  outlineThickness,
  updateOutlineThickness,
} from "../apps/web/src/domain/outline-settings.js";

test("outline defaults to fixed ten percent", () => {
  assert.equal(DEFAULT_OUTLINE_SCALE, 10);
  assert.equal(outlineThickness(DEFAULT_OUTLINE_SCALE), 0.00052);
});

test("hot outline updates reuse all cached materials and apply to future materials", () => {
  const defaults = { outlineThickness: { value: outlineThickness(100) } };
  const cache = Object.fromEntries(
    ["building", "furniture", "device"].map((name) => [
      name,
      {
        material: new ShaderMaterial({
          uniforms: UniformsUtils.clone(defaults),
        }),
      },
    ]),
  );
  const originals = Object.values(cache).map((entry) => entry.material);
  updateOutlineThickness(defaults, cache, outlineThickness(25));
  for (const [index, entry] of Object.values(cache).entries()) {
    assert.equal(entry.material, originals[index]);
    assert.equal(entry.material.uniforms.outlineThickness.value, 0.0013);
  }
  const late = new ShaderMaterial({ uniforms: UniformsUtils.clone(defaults) });
  assert.equal(late.uniforms.outlineThickness.value, 0.0013);
  updateOutlineThickness(defaults, cache, outlineThickness(100));
  assert.equal(cache.building.material.uniforms.outlineThickness.value, 0.0052);
  for (const material of [...originals, late]) material.dispose();
});
