import type { AgeValue, BasicSettings, PromptSnapshot, TimelineEvent } from "./types";
import { CAPTURE_DEVICE_DESCRIPTIONS } from "./constants";

const cleanSentence = (value = "") => value.trim().replace(/[.\s]+$/, "");

export function formatAge(age: AgeValue): string {
  if (age.kind === "range") return `${Math.max(18, age.min)} to ${Math.max(18, age.max)}-year-old`;
  return `${Math.max(18, age.value)}-year-old`;
}

export function supportedDurations(basic: Pick<BasicSettings, "mode" | "resolution">): number[] {
  if (basic.mode === "S2V" || basic.resolution === "1080P") return [6];
  return [6, 10];
}

const commandText = (commands: string[]) => commands.length ? `[${commands.slice(0, 3).join(",")}]` : "";

export function buildTimelineSegment(event: TimelineEvent, maleActor: boolean): string {
  const details = [
    commandText(event.cameraCommands || []),
    cleanSentence(event.camera),
    `Subject pose: ${cleanSentence(event.pose)}`,
    `She is ${cleanSentence(event.clothingState)}`,
    maleActor && event.position ? cleanSentence(event.position) : "solo scene",
    maleActor && event.intimacyMode === "consensual anal intercourse" ? "consensual anal intercourse" : "",
    cleanSentence(event.action),
    cleanSentence(event.expression),
    event.adultToy && event.adultToy !== "no adult toy" ? `Adult toy: ${cleanSentence(event.adultToy)}` : "",
    `Captured at ${cleanSentence(event.aperture)} with ${cleanSentence(event.depthOfField)}`,
    `Focus stays on ${cleanSentence(event.focusTarget)} using ${cleanSentence(event.focusBehavior)}`,
    `${cleanSentence(event.frameRate)}, ${cleanSentence(event.shutterAngle)}`,
    event.additionalDetails ? cleanSentence(event.additionalDetails) : "",
  ].filter(Boolean);
  return `[${event.start}-${event.end}s] ${details.join(". ")}.`;
}

const continuityText = (basic: BasicSettings) => {
  const rules = [
    basic.preserveIdentity && "preserve facial identity and body proportions across every frame",
    basic.preserveWardrobe && "maintain exact wardrobe continuity",
    basic.stabilizeAnatomy && "keep hands, fingers, limbs, and anatomy stable",
    basic.stabilizeBackground && "prevent background warping or object morphing",
    basic.preserveLighting && "preserve the established lighting direction and color temperature",
    basic.preventCameraTeleport && "avoid camera teleportation and impossible perspective jumps",
    basic.continuousTake && "render as a continuous take without unintended cuts",
  ].filter(Boolean);
  return rules.length ? `Continuity constraints: ${rules.join(", ")}.` : "";
};

export function generateH3Prompt(state: PromptSnapshot): string {
  const { basic, situation, clothing, events, soundscape, music, customNotes } = state;
  const sortedEvents = [...events].sort((a, b) => (a.shotNumber || 1) - (b.shotNumber || 1) || a.start - b.start);

  let subject = `${cleanSentence(basic.style)}, ${cleanSentence(basic.lighting)}. `;
  subject += "All depicted performers are consenting adults aged 18 or older. ";
  subject += `A ${formatAge(basic.age)} Japanese woman, ${cleanSentence(basic.bodyType)}, ${cleanSentence(basic.bustSize)}, ${cleanSentence(basic.hair)}, ${cleanSentence(basic.eyes)}, ${cleanSentence(basic.skin)}.`;
  if (basic.maleActor) {
    subject += ` A ${cleanSentence(basic.maleBodyType)}, ${cleanSentence(basic.maleAgeFeel)} Japanese man`;
    subject += basic.maleFaceVisible ? "." : ", with his face kept out of clear view.";
  }

  const device = CAPTURE_DEVICE_DESCRIPTIONS[basic.captureDevice] ?? cleanSentence(basic.captureDevice);
  const capture = `Capture profile: ${cleanSentence(device)}. Lens: ${cleanSentence(basic.focalLength)}. Camera-to-subject distance: ${cleanSentence(basic.subjectDistance)}. ${basic.handheldShake
    ? `${cleanSentence(basic.handheldStyle)} with physically plausible operator drift and breathing-induced micro-movement, without synthetic jitter`
    : "Stable camera support with no handheld shake"}.`;

  const shotNumbers = [...new Set(sortedEvents.map((event) => event.shotNumber || 1))];
  const shots = shotNumbers.length
    ? shotNumbers.map((shotNumber, index) => {
      const shotEvents = sortedEvents.filter((event) => (event.shotNumber || 1) === shotNumber);
      const transition = index > 0 ? ` Transition: ${cleanSentence(shotEvents[0]?.transition || "hard cut")}.` : "";
      return `${index > 0 ? ` [Shot ${shotNumber}]${transition}` : ""} ${shotEvents.map((event) => buildTimelineSegment(event, basic.maleActor)).join(" ")}`;
    }).join("")
    : ` [0-${basic.duration}s] Medium shot. She is ${cleanSentence(clothing)} in a ${cleanSentence(situation)}. ${basic.maleActor ? "A consenting adult couple shares a sensual intimate moment" : "She performs a sensual solo scene"}.`;

  const notes = customNotes.trim() ? ` ${cleanSentence(customNotes)}.` : "";
  const integrated = `[Shot 1] ${subject} ${capture} ${continuityText(basic)} Location: ${cleanSentence(situation)}.${shots}${notes}`;
  let referencePrefix = "";
  if (basic.mode === "I2V" || basic.mode === "FLF") {
    referencePrefix += "For the target video, at 0.00 seconds into the target video, <Picture 1> is fully referenced as the starting appearance and identity of the Japanese woman.\n";
  }
  if (basic.mode === "FLF") referencePrefix += "The final target frame fully references <Picture 2> as the ending composition, pose, and camera destination.\n";
  if (basic.mode === "S2V") referencePrefix += "<Picture 1> is fully referenced as the adult Japanese woman's facial identity throughout the target video.\n";
  if (referencePrefix) referencePrefix += "\n";

  return `${referencePrefix}integrated_multimodal_description: ${integrated}\n\noverall_soundscape: ${cleanSentence(soundscape)}\n\nnon_diegetic_music: ${music || "N/A"}`;
}

export function generateApiPayload(state: PromptSnapshot) {
  const { basic } = state;
  const payload: Record<string, unknown> = {
    model: basic.model,
    prompt: generateH3Prompt(state),
    duration: basic.duration,
    resolution: basic.resolution,
    prompt_optimizer: basic.promptOptimizer,
  };
  if (basic.fastPretreatment && basic.model.includes("Hailuo")) payload.fast_pretreatment = true;
  if (basic.mode === "I2V" || basic.mode === "FLF") payload.first_frame_image = basic.firstFrameImage || "<FIRST_FRAME_IMAGE_URL_OR_DATA_URI>";
  if (basic.mode === "FLF") payload.last_frame_image = basic.lastFrameImage || "<LAST_FRAME_IMAGE_URL_OR_DATA_URI>";
  if (basic.mode === "S2V") {
    payload.subject_reference = [{ type: "character", image: [basic.subjectReferenceImage || "<SUBJECT_REFERENCE_IMAGE_URL>"] }];
  }
  return payload;
}

export interface TimelineIssue {
  type: "gap" | "overlap" | "bounds" | "range";
  message: string;
}

export function validateTimeline(events: TimelineEvent[], duration: number): TimelineIssue[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const issues: TimelineIssue[] = [];
  sorted.forEach((event, index) => {
    if (event.start < 0 || event.end > duration) issues.push({ type: "bounds", message: `Event ${index + 1} extends outside 0-${duration}s.` });
    if (event.end <= event.start) issues.push({ type: "range", message: `Event ${index + 1} needs an end time after its start.` });
    const previous = sorted[index - 1];
    if (previous) {
      const delta = event.start - previous.end;
      if (delta > 0.5) issues.push({ type: "gap", message: `${delta.toFixed(1)}s gap before event ${index + 1}.` });
      if (delta < -0.5) issues.push({ type: "overlap", message: `${Math.abs(delta).toFixed(1)}s overlap at event ${index + 1}.` });
    }
  });
  return issues;
}

export interface PromptDiagnostic { severity: "error" | "warning" | "info"; message: string }

export function diagnosePrompt(state: PromptSnapshot): PromptDiagnostic[] {
  const { basic, events } = state;
  const diagnostics: PromptDiagnostic[] = [];
  const prompt = generateH3Prompt(state);
  if (prompt.length > 2000) diagnostics.push({ severity: "error", message: `Prompt is ${prompt.length - 2000} characters over the official 2,000-character limit.` });
  else if (prompt.length > 1800) diagnostics.push({ severity: "warning", message: "Prompt is close to the 2,000-character limit." });
  if (!supportedDurations(basic).includes(basic.duration)) diagnostics.push({ severity: "error", message: `${basic.resolution} does not support a ${basic.duration}s generation.` });
  if (basic.mode === "FLF" && basic.model !== "MiniMax-Hailuo-02") diagnostics.push({ severity: "error", message: "First/last-frame mode requires MiniMax-Hailuo-02." });
  if (basic.mode === "S2V" && basic.model !== "S2V-01") diagnostics.push({ severity: "error", message: "Subject-reference mode requires S2V-01." });
  if (basic.mode === "I2V" && !basic.firstFrameImage) diagnostics.push({ severity: "warning", message: "Add a first-frame image URL before using the API JSON." });
  if (basic.mode === "FLF" && (!basic.firstFrameImage || !basic.lastFrameImage)) diagnostics.push({ severity: "warning", message: "First/last-frame mode needs both image URLs." });
  if (basic.mode === "S2V" && !basic.subjectReferenceImage) diagnostics.push({ severity: "warning", message: "Add a subject-reference image URL before using the API JSON." });
  events.forEach((event, index) => {
    if ((event.cameraCommands?.length || 0) > 3) diagnostics.push({ severity: "error", message: `Event ${index + 1} uses more than three simultaneous camera commands.` });
  });
  if (basic.focalLength.startsWith("120mm") && basic.subjectDistance.startsWith("0.3m")) diagnostics.push({ severity: "warning", message: "120mm at 0.3m is likely too close to focus naturally." });
  if (!events.length) diagnostics.push({ severity: "info", message: "Add timeline events for precise shot and focus control." });
  return diagnostics;
}
