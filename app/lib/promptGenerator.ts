import type { AgeValue, PromptSnapshot, TimelineEvent } from "./types";

const cleanSentence = (value: string) => value.trim().replace(/[.\s]+$/, "");

export function formatAge(age: AgeValue): string {
  if (age.kind === "range") {
    return `${Math.max(18, age.min)} to ${Math.max(18, age.max)}-year-old`;
  }
  return `${Math.max(18, age.value)}-year-old`;
}

export function buildTimelineSegment(
  event: TimelineEvent,
  maleActor: boolean,
): string {
  const details = [
    cleanSentence(event.camera),
    `She is ${cleanSentence(event.clothingState)}`,
    maleActor && event.position ? cleanSentence(event.position) : "solo scene",
    cleanSentence(event.action),
    cleanSentence(event.expression),
    event.additionalDetails ? cleanSentence(event.additionalDetails) : "",
  ].filter(Boolean);

  return `[${event.start}-${event.end}s] ${details.join(". ")}.`;
}

export function generateH3Prompt(state: PromptSnapshot): string {
  const { basic, situation, clothing, events, soundscape, music, customNotes } = state;
  const sortedEvents = [...events].sort((a, b) => a.start - b.start);

  let subject = `${cleanSentence(basic.style)}, ${cleanSentence(basic.lighting)}. `;
  subject += `All depicted performers are consenting adults aged 18 or older. `;
  subject += `A ${formatAge(basic.age)} Japanese woman, ${cleanSentence(basic.bodyType)}, ${cleanSentence(basic.hair)}, ${cleanSentence(basic.eyes)}, ${cleanSentence(basic.skin)}.`;

  if (basic.maleActor) {
    subject += ` A ${cleanSentence(basic.maleBodyType)}, ${cleanSentence(basic.maleAgeFeel)} Japanese man`;
    subject += basic.maleFaceVisible ? "." : ", with his face kept out of clear view.";
  }

  const timeline = sortedEvents.length
    ? sortedEvents.map((event) => buildTimelineSegment(event, basic.maleActor)).join(" ")
    : `[0-${basic.duration}s] Medium shot. She is ${cleanSentence(clothing)} in a ${cleanSentence(situation)}. ${basic.maleActor ? "A consenting adult couple shares a sensual intimate moment" : "She performs a sensual solo scene"}.`;

  const notes = customNotes.trim() ? ` ${cleanSentence(customNotes)}.` : "";
  const integrated = `[Shot 1] ${subject} Location: ${cleanSentence(situation)}. ${timeline}${notes}`;
  const i2vPrefix = basic.mode === "I2V"
    ? "For the target video, at 0.00 seconds into the target video, <Picture 1> is fully referenced as the starting appearance and identity of the Japanese woman.\n\n"
    : "";

  return `${i2vPrefix}integrated_multimodal_description: ${integrated}\n\noverall_soundscape: ${cleanSentence(soundscape)}\n\nnon_diegetic_music: ${music || "N/A"}`;
}

export interface TimelineIssue {
  type: "gap" | "overlap" | "bounds" | "range";
  message: string;
}

export function validateTimeline(events: TimelineEvent[], duration: number): TimelineIssue[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const issues: TimelineIssue[] = [];

  sorted.forEach((event, index) => {
    if (event.start < 0 || event.end > duration) {
      issues.push({ type: "bounds", message: `Event ${index + 1} extends outside 0-${duration}s.` });
    }
    if (event.end <= event.start) {
      issues.push({ type: "range", message: `Event ${index + 1} needs an end time after its start.` });
    }
    const previous = sorted[index - 1];
    if (previous) {
      const delta = event.start - previous.end;
      if (delta > 0.5) issues.push({ type: "gap", message: `${delta.toFixed(1)}s gap before event ${index + 1}.` });
      if (delta < -0.5) issues.push({ type: "overlap", message: `${Math.abs(delta).toFixed(1)}s overlap at event ${index + 1}.` });
    }
  });

  return issues;
}
