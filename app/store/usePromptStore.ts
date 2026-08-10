"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { AgeValue, BasicSettings, MasterCategory, MasterData, MasterItem, PromptSnapshot, SavedPreset, TimelineEvent, UiLanguage } from "../lib/types";
import { DEFAULT_MASTER_DATA, MALE_POV_CAMERA, STYLE_PRESETS } from "../lib/constants";
import { japaneseOption } from "../lib/localization";

interface PromptState extends PromptSnapshot {
  uiLanguage: UiLanguage;
  savedPresets: SavedPreset[];
  masterData: MasterData;
  setBasic: (partial: Partial<BasicSettings>) => void;
  setSituation: (value: string) => void;
  setClothing: (value: string) => void;
  setSoundscape: (value: string) => void;
  setMusic: (value: string) => void;
  setCustomNotes: (value: string) => void;
  setUiLanguage: (language: UiLanguage) => void;
  addEvent: () => void;
  addShot: () => void;
  updateEvent: (id: string, data: Partial<TimelineEvent>) => void;
  removeEvent: (id: string) => void;
  reorderEvents: (oldIndex: number, newIndex: number) => void;
  autoFitEvents: () => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  addMasterItem: (category: MasterCategory, item: MasterItem) => void;
  updateMasterItem: (category: MasterCategory, index: number, item: Partial<MasterItem>) => void;
  removeMasterItem: (category: MasterCategory, index: number) => void;
  resetMasterData: () => void;
  resetAll: () => void;
}

export const defaultBasic: BasicSettings = {
  mode: "T2V",
  age: { kind: "exact", value: 26 },
  bodyType: "glamorous",
  bustSize: "C-cup breasts",
  hair: "long straight black hair",
  eyes: "large brown eyes",
  skin: "fair Japanese skin with realistic texture",
  maleActor: true,
  maleBodyType: "muscular",
  maleAgeFeel: "late 20s",
  maleFaceVisible: true,
  duration: 6,
  style: STYLE_PRESETS[0],
  lighting: "soft warm bedside lighting",
  captureDevice: "professional cinema camera",
  focalLength: "50mm standard",
  subjectDistance: "1.5m medium distance",
  handheldShake: true,
  handheldStyle: "natural documentary shake",
  model: "MiniMax-Hailuo-2.3",
  resolution: "1080P",
  promptOptimizer: false,
  fastPretreatment: false,
  firstFrameImage: "",
  lastFrameImage: "",
  subjectReferenceImage: "",
  preserveIdentity: true,
  preserveWardrobe: true,
  stabilizeAnatomy: true,
  stabilizeBackground: true,
  preserveLighting: true,
  preventCameraTeleport: true,
  continuousTake: false,
};

const initialSnapshot: PromptSnapshot = {
  basic: defaultBasic,
  situation: "love hotel bedroom with soft lighting",
  clothing: "black lace lingerie",
  events: [],
  soundscape: "heavy breathing, intimate movement sounds, soft Japanese moans, rhythmic skin contact, and quiet bed creaking",
  music: "N/A",
  customNotes: "",
};

const clampAge = (age: AgeValue): AgeValue => {
  if (age.kind === "range") {
    const min = Math.max(18, age.min);
    return { kind: "range", min, max: Math.max(min, age.max, 18) };
  }
  return { kind: "exact", value: Math.max(18, age.value) };
};

const migrateMasterData = (data: unknown): MasterData => {
  const legacy = data as Partial<Record<MasterCategory, unknown>> | undefined;
  const result = {} as MasterData;
  for (const category of Object.keys(DEFAULT_MASTER_DATA) as MasterCategory[]) {
    const items = legacy?.[category];
    result[category] = Array.isArray(items)
      ? items.filter(Boolean).map((item) => {
        if (typeof item === "string") return { value: item, japanese: japaneseOption(item) };
        const candidate = item as Partial<MasterItem>;
        const value = typeof candidate.value === "string" ? candidate.value : "";
        return { value, japanese: typeof candidate.japanese === "string" ? candidate.japanese : japaneseOption(value) };
      }).filter((item) => item.value.trim())
      : structuredClone(DEFAULT_MASTER_DATA[category]);
    if (!result[category].length) result[category] = structuredClone(DEFAULT_MASTER_DATA[category]);
  }
  return result;
};

const snapshotFromState = (state: PromptState): PromptSnapshot => ({
  basic: structuredClone(state.basic),
  situation: state.situation,
  clothing: state.clothing,
  events: structuredClone(state.events),
  soundscape: state.soundscape,
  music: state.music,
  customNotes: state.customNotes,
});

const fitEvents = (events: TimelineEvent[], duration: number): TimelineEvent[] => {
  if (!events.length) return events;
  const step = duration / events.length;
  return events.map((event, index) => ({
    ...event,
    start: Number((index * step).toFixed(1)),
    end: Number(((index + 1) * step).toFixed(1)),
  }));
};

const normalizeEvent = (event: TimelineEvent): TimelineEvent => ({
  ...event,
  pose: event.pose || "standing in a relaxed pose",
  intimacyMode: event.intimacyMode === "consensual anal intercourse" ? "consensual anal intercourse" : "standard intimate contact",
  shotNumber: Math.max(1, event.shotNumber || 1),
  transition: event.transition || "continuous cut-free movement",
  cameraCommands: Array.isArray(event.cameraCommands) ? event.cameraCommands.slice(0, 3) : [],
  aperture: event.aperture || "f/2.8",
  depthOfField: event.depthOfField || "shallow depth of field",
  focusTarget: event.focusTarget || "face",
  focusBehavior: event.focusBehavior || "continuous subject-tracking autofocus",
  frameRate: event.frameRate || "24 fps cinematic motion",
  shutterAngle: event.shutterAngle || "180-degree shutter",
});

const normalizeBasic = (candidate: BasicSettings): BasicSettings => {
  const basic = { ...defaultBasic, ...candidate, age: clampAge(candidate.age) };
  if (basic.mode === "FLF") {
    basic.model = "MiniMax-Hailuo-02";
    if (basic.resolution === "512P") basic.resolution = "768P";
  } else if (basic.mode === "S2V") {
    basic.model = "S2V-01";
    basic.resolution = "1080P";
  } else {
    if (basic.model === "S2V-01") basic.model = "MiniMax-Hailuo-2.3";
    if (basic.model === "MiniMax-Hailuo-2.3-Fast" && basic.mode !== "I2V") basic.model = "MiniMax-Hailuo-2.3";
    if (basic.resolution === "512P" && basic.model !== "MiniMax-Hailuo-02") basic.resolution = "768P";
  }
  if (basic.resolution === "1080P" || basic.mode === "S2V") basic.duration = 6;
  else basic.duration = basic.duration >= 8 ? 10 : 6;
  return basic;
};

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      ...initialSnapshot,
      uiLanguage: "ENG",
      savedPresets: [],
      masterData: structuredClone(DEFAULT_MASTER_DATA),
      setBasic: (partial) => set((state) => {
        const nextBasic = normalizeBasic({ ...state.basic, ...partial, age: partial.age ?? state.basic.age });
        let nextEvents = state.events;
        if (nextBasic.duration !== state.basic.duration) {
          nextEvents = fitEvents(state.events, nextBasic.duration);
        }
        if (partial.maleActor === false) {
          nextEvents = nextEvents.map((event, index) => ({
            ...event,
            position: "",
            camera: event.camera === MALE_POV_CAMERA ? "medium shot" : event.camera,
            intimacyMode: "standard intimate contact",
            action: state.masterData.soloActions[Math.min(index, state.masterData.soloActions.length - 1)].value,
          }));
        }
        return { basic: nextBasic, events: nextEvents };
      }),
      setSituation: (situation) => set({ situation }),
      setClothing: (clothing) => set({ clothing }),
      setSoundscape: (soundscape) => set({ soundscape }),
      setMusic: (music) => set({ music }),
      setCustomNotes: (customNotes) => set({ customNotes }),
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      addEvent: () => set((state) => {
        const count = state.events.length + 1;
        const newEvent: TimelineEvent = {
          id: uuidv4(),
          start: 0,
          end: state.basic.duration,
          position: state.basic.maleActor ? "missionary position" : "",
          action: state.basic.maleActor ? (state.masterData.partnerActions[3] ?? state.masterData.partnerActions[0]).value : state.masterData.soloActions[0].value,
          clothingState: state.clothing,
          camera: "medium shot",
          pose: "standing in a relaxed pose",
          expression: "flushed cheeks, slightly open mouth, eyes half-closed",
          intimacyMode: "standard intimate contact",
          additionalDetails: "",
          shotNumber: Math.max(1, ...state.events.map((event) => event.shotNumber || 1)),
          transition: "continuous cut-free movement",
          cameraCommands: [],
          aperture: "f/2.8",
          depthOfField: "shallow depth of field",
          focusTarget: "face",
          focusBehavior: "continuous subject-tracking autofocus",
          frameRate: "24 fps cinematic motion",
          shutterAngle: "180-degree shutter",
        };
        return { events: fitEvents([...state.events, newEvent], state.basic.duration).slice(0, count) };
      }),
      addShot: () => set((state) => {
        const nextShot = Math.max(0, ...state.events.map((event) => event.shotNumber || 1)) + 1;
        const template = state.events[state.events.length - 1];
        const newEvent = normalizeEvent({
          id: uuidv4(), start: 0, end: state.basic.duration,
          position: state.basic.maleActor ? (template?.position || "missionary position") : "",
          action: template?.action || (state.basic.maleActor ? state.masterData.partnerActions[0].value : state.masterData.soloActions[0].value),
          clothingState: template?.clothingState || state.clothing,
          camera: template?.camera || "medium shot",
          pose: template?.pose || "standing in a relaxed pose",
          expression: template?.expression || "flushed cheeks, slightly open mouth, eyes half-closed",
          intimacyMode: template?.intimacyMode || "standard intimate contact",
          additionalDetails: "",
          shotNumber: nextShot,
          transition: nextShot === 1 ? "continuous cut-free movement" : "hard cut",
          cameraCommands: [], aperture: template?.aperture || "f/2.8",
          depthOfField: template?.depthOfField || "shallow depth of field",
          focusTarget: template?.focusTarget || "face",
          focusBehavior: template?.focusBehavior || "continuous subject-tracking autofocus",
          frameRate: template?.frameRate || "24 fps cinematic motion",
          shutterAngle: template?.shutterAngle || "180-degree shutter",
        });
        return { events: fitEvents([...state.events, newEvent], state.basic.duration) };
      }),
      updateEvent: (id, data) => set((state) => ({
        events: state.events.map((event) => event.id === id ? { ...event, ...data } : event),
      })),
      removeEvent: (id) => set((state) => ({
        events: fitEvents(state.events.filter((event) => event.id !== id), state.basic.duration),
      })),
      reorderEvents: (oldIndex, newIndex) => set((state) => {
        const reordered = [...state.events];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        return { events: fitEvents(reordered, state.basic.duration) };
      }),
      autoFitEvents: () => set((state) => ({ events: fitEvents(state.events, state.basic.duration) })),
      savePreset: (name) => set((state) => ({
        savedPresets: [{ id: uuidv4(), name: name.trim(), savedAt: new Date().toISOString(), snapshot: snapshotFromState(state) }, ...state.savedPresets].slice(0, 12),
      })),
      loadPreset: (id) => set((state) => {
        const preset = state.savedPresets.find((item) => item.id === id);
        return preset ? {
          ...structuredClone(preset.snapshot),
          basic: normalizeBasic({ ...defaultBasic, ...preset.snapshot.basic }),
          events: preset.snapshot.events.map(normalizeEvent),
        } : {};
      }),
      deletePreset: (id) => set((state) => ({ savedPresets: state.savedPresets.filter((item) => item.id !== id) })),
      addMasterItem: (category, item) => set((state) => {
        const clean = item.value.trim();
        const items = state.masterData[category];
        if (!clean || items.some((existing) => existing.value.toLocaleLowerCase() === clean.toLocaleLowerCase())) return {};
        return { masterData: { ...state.masterData, [category]: [...items, { value: clean, japanese: item.japanese.trim() }] } };
      }),
      updateMasterItem: (category, index, patch) => set((state) => {
        const items = state.masterData[category];
        const current = items[index];
        if (!current) return {};
        const value = patch.value === undefined ? current.value : patch.value.trim();
        if (!value || items.some((item, itemIndex) => itemIndex !== index && item.value.toLocaleLowerCase() === value.toLocaleLowerCase())) return {};
        return { masterData: { ...state.masterData, [category]: items.map((item, itemIndex) => itemIndex === index ? { value, japanese: patch.japanese === undefined ? item.japanese : patch.japanese.trim() } : item) } };
      }),
      removeMasterItem: (category, index) => set((state) => {
        const items = state.masterData[category];
        if (items.length <= 1) return {};
        return { masterData: { ...state.masterData, [category]: items.filter((_, itemIndex) => itemIndex !== index) } };
      }),
      resetMasterData: () => set({ masterData: structuredClone(DEFAULT_MASTER_DATA) }),
      resetAll: () => set((state) => ({ ...structuredClone(initialSnapshot), savedPresets: state.savedPresets, masterData: state.masterData })),
    }),
    {
      name: "frameforge-h3-adult-prompt-storage",
      version: 8,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<PromptState>;
        const masterData = migrateMasterData(persisted.masterData);
        if (version < 4 && !masterData.cameras.some((item) => item.value === MALE_POV_CAMERA)) {
          masterData.cameras.push({ value: MALE_POV_CAMERA, japanese: japaneseOption(MALE_POV_CAMERA) });
        }
        return {
          ...persisted,
          basic: persisted.basic ? normalizeBasic({ ...defaultBasic, ...persisted.basic }) : defaultBasic,
          masterData,
          events: persisted.events?.map(normalizeEvent),
        };
      },
    },
  ),
);
