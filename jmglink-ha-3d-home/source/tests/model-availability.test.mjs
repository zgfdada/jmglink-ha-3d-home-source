import assert from "node:assert/strict";
import test from "node:test";
import { Color, Group, Mesh, MeshStandardMaterial, BoxGeometry } from "three";
import { applyModelAvailability } from "../apps/web/src/domain/model-availability.js";

test("offline custom model desaturates and fades each material, then restores original colors", () => {
  const root = new Group();
  const red = new MeshStandardMaterial({ color: "#d63832", opacity: 0.8 });
  const blue = new MeshStandardMaterial({
    color: "#275bd0",
    transparent: true,
    opacity: 0.7,
  });
  root.add(new Mesh(new BoxGeometry(), [red, blue]));
  const originalRed = red.color.clone();
  const originalBlue = blue.color.clone();

  applyModelAvailability(root, true);
  assert.equal(red.opacity, 0.4);
  assert.equal(blue.opacity, 0.35);
  assert.equal(red.transparent, true);
  assert.equal(blue.transparent, true);
  assert.equal(red.color.equals(originalRed), false);
  assert.equal(blue.color.equals(originalBlue), false);

  applyModelAvailability(root, true);
  assert.equal(red.opacity, 0.4, "repeated offline updates must not accumulate");
  applyModelAvailability(root, false);
  assert.ok(red.color.equals(originalRed));
  assert.ok(blue.color.equals(originalBlue));
  assert.equal(red.opacity, 0.8);
  assert.equal(blue.opacity, 0.7);
  assert.equal(red.transparent, false);
  assert.equal(blue.transparent, true);
});

test("offline model leaves furniture unchanged unless explicitly given device availability", () => {
  const root = new Group();
  const material = new MeshStandardMaterial({ color: new Color("#46a973") });
  root.add(new Mesh(new BoxGeometry(), material));
  const original = material.color.clone();
  applyModelAvailability(root, false);
  assert.ok(material.color.equals(original));
  assert.equal(material.opacity, 1);
  assert.equal(material.transparent, false);
});
