import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runnerImport } from "vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const i2vPath = fileURLToPath(new URL("../app/lib/i2vPromptGenerator.ts", import.meta.url));
const promptPath = fileURLToPath(new URL("../app/lib/promptGenerator.ts", import.meta.url));
const { module: i2vModule } = await runnerImport(i2vPath, { root: projectRoot, logLevel: "silent" });
const { module: promptModule } = await runnerImport(promptPath, { root: projectRoot, logLevel: "silent" });
const { generateI2VPrompt, diagnoseI2VPrompt } = i2vModule;
const { generateH3Prompt, generateApiPayload, supportedDurations } = promptModule;


const event = {
  id: "event-1",
  start: 0,
  end: 6,
  shotNumber: 1,
  position: "",
  pose: "seated with legs crossed",
  action: "slowly raises one hand and looks toward the camera",
  clothingState: "black evening dress",
  expression: "a gentle relaxed smile",
  performanceTone: "quiet and natural",
  partnerHandAction: "",
  perspirationEffect: "no visible perspiration",
  lotionEffect: "no visible lotion",
  lactationEffect: "no visible lactation",
  dialogueText: "",
  camera: "over-the-shoulder",
  cameraPlacement: "camera positioned directly in front of the primary woman at her eye level",
  cameraMotion: "pulls back from the subject",
  motionSpeed: "slow speed",
  motionAmplitude: "small amplitude",
  shotSize: "wide shot, full body visible with generous space around the subject",
};

const snapshot = {
  basic: {
    mode: "I2V",
    duration: 6,
    sceneType: "solo",
    firstFrameImage: "https://example.com/frame.png",
    promptOptimizer: true,
    i2vClothingStartSource: "reference-image",
    i2vPoseStartSource: "reference-image",
    i2vBackgroundSource: "reference-image",
    i2vCameraSource: "reference-image",
    i2vMotionIntensity: "subtle",
    i2vTransitionTiming: "balanced",
    bodyType: "slender",
    hair: "bob cut black hair",
    eyes: "large brown eyes",
    skin: "fair skin",
    bustSize: "C-cup breasts",
  },
  situation: "a completely different room",
  clothing: "white shirt",
  events: [event],
  soundscape: "quiet room tone and breathing",
  music: "N/A",
  customNotes: "keep the gesture restrained",
};

test("I2V uses a dedicated delta-only prompt and excludes T2V appearance reconstruction", () => {
  const prompt = generateI2VPrompt(snapshot);
  assert.match(prompt, /FIRST-FRAME AUTHORITY/);
  assert.match(prompt, /INITIAL HOLD \[0\.00-0\.6s\]/);
  assert.match(prompt, /CONTROLLED TRANSITION \[0\.6-3\.6s\]/);
  assert.match(prompt, /Preserve the first frame's exact camera position/);
  assert.match(prompt, /ADDITIONAL MOTION DIRECTION: keep the gesture restrained/);
  assert.match(prompt, /pose\/position target seated with legs crossed/);
  assert.doesNotMatch(prompt, /bob cut black hair|large brown eyes|C-cup breasts|completely different room|over-the-shoulder/);
  assert.equal(generateH3Prompt(snapshot), prompt);
});

test("15-second generations are available outside S2V, including 1080P", () => {
  assert.deepEqual(supportedDurations({ mode: "T2V", resolution: "1080P" }), [6, 10, 15]);
  assert.deepEqual(supportedDurations({ mode: "I2V", resolution: "768P" }), [6, 10, 15]);
  assert.deepEqual(supportedDurations({ mode: "S2V", resolution: "1080P" }), [6]);
});

test("I2V prompt camera control is relative and reconciles angle with placement", () => {
  const prompt = generateI2VPrompt({
    ...snapshot,
    basic: { ...snapshot.basic, i2vCameraSource: "prompt" },
  });
  assert.match(prompt, /Start from the first frame's exact camera and composition/);
  assert.match(prompt, /target angle over-the-shoulder/);
  assert.match(prompt, /camera positioned just behind and over the primary woman's shoulder/);
});

test("I2V disables prompt optimization and reports risky controls", () => {
  const risky = {
    ...snapshot,
    basic: {
      ...snapshot.basic,
      i2vBackgroundSource: "prompt",
      i2vCameraSource: "prompt",
      i2vMotionIntensity: "strong",
    },
  };
  assert.equal(generateApiPayload(risky).prompt_optimizer, false);
  const messages = diagnoseI2VPrompt(risky).map((item) => item.message).join(" ");
  assert.match(messages, /Strong I2V motion/);
  assert.match(messages, /Changing the reference background/);
  assert.match(messages, /Changing the reference camera/);
});
