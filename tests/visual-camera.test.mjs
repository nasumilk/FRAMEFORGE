import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runnerImport } from "vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const visualComposerPath = fileURLToPath(new URL("../app/lib/visualComposer.ts", import.meta.url));
const { module: visualComposer } = await runnerImport(visualComposerPath, { root: projectRoot, logLevel: "silent" });
const { linkedCameraPatch, normalizeVisualCameraBody } = visualComposer;

test("Visual camera points authoritatively map the visible body direction", () => {
  const front = linkedCameraPatch("front");
  const side = linkedCameraPatch("left");
  const rear = linkedCameraPatch("rear");

  assert.match(front.cameraPlacement, /directly in front/);
  assert.match(front.bodyOrientation, /front-facing/);
  assert.match(side.cameraPlacement, /directly beside/);
  assert.match(side.bodyOrientation, /side profile/);
  assert.match(rear.cameraPlacement, /behind/);
  assert.match(rear.bodyOrientation, /back facing/);
});

test("saved Visual events are normalized while Manual-only events remain independent", () => {
  const conflictingVisualEvent = {
    visualCameraPoint: "rear",
    visualBodyDirection: "front",
    cameraPlacement: "camera positioned directly in front",
    bodyOrientation: "front-facing toward the camera",
  };
  const normalized = normalizeVisualCameraBody(conflictingVisualEvent);
  assert.match(normalized.cameraPlacement, /behind/);
  assert.match(normalized.bodyOrientation, /back facing/);
  assert.equal(normalized.visualBodyDirection, "rear-look");

  const manualEvent = {
    cameraPlacement: "camera positioned behind the subject",
    bodyOrientation: "front-facing by deliberate manual choice",
  };
  assert.deepEqual(normalizeVisualCameraBody(manualEvent), manualEvent);
});
