"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { BasicSettings, MasterCategory, MasterData, PromptSnapshot, SavedPreset, TimelineEvent } from "../lib/types";
import { DEFAULT_MASTER_DATA, STYLE_PRESETS } from "../lib/constants";

interface PromptState extends PromptSnapshot {
  savedPresets: SavedPreset[];
  masterData: MasterData;
  setBasic: (partial: Partial<BasicSettings>) => void;
  setSituation: (value: string) => void;
  setClothing: (value: string) => void;
  setSoundscape: (value: string) => void;
  setMusic: (value: string) => void;
  setCustomNotes: (value: string) => void;
  addEvent: () => void;
  updateEvent: (id: string, data: Partial<TimelineEvent>) => void;
  removeEvent: (id: string) => void;
  reorderEvents: (oldIndex: number, newIndex: number) => void;
  autoFitEvents: () => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  addMasterItem: (category: MasterCategory, value: string) => void;
  updateMasterItem: (category: MasterCategory, index: number, value: string) => void;
  removeMasterItem: (category: MasterCategory, index: number) => void;
  resetMasterData: () => void;
  resetAll: () => void;
}

export const defaultBasic: BasicSettings = {
  mode: "T2V",
  age: { kind: "exact", value: 26 },
  bodyType: "glamorous",
  hair: "long straight black hair",
  eyes: "large brown eyes",
  skin: "fair Japanese skin with realistic texture",
  maleActor: true,
  maleBodyType: "muscular",
  maleAgeFeel: "late 20s",
  maleFaceVisible: true,
  duration: 8,
  style: STYLE_PRESETS[0],
  lighting: "soft warm bedside lighting",
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

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      ...initialSnapshot,
      savedPresets: [],
      masterData: structuredClone(DEFAULT_MASTER_DATA),
      setBasic: (partial) => set((state) => {
        const nextBasic = { ...state.basic, ...partial };
        let nextEvents = state.events;
        if (partial.duration !== undefined && partial.duration !== state.basic.duration) {
          nextEvents = fitEvents(state.events, partial.duration);
        }
        if (partial.maleActor === false) {
          nextEvents = nextEvents.map((event, index) => ({
            ...event,
            position: "",
            action: state.masterData.soloActions[Math.min(index, state.masterData.soloActions.length - 1)],
          }));
        }
        return { basic: nextBasic, events: nextEvents };
      }),
      setSituation: (situation) => set({ situation }),
      setClothing: (clothing) => set({ clothing }),
      setSoundscape: (soundscape) => set({ soundscape }),
      setMusic: (music) => set({ music }),
      setCustomNotes: (customNotes) => set({ customNotes }),
      addEvent: () => set((state) => {
        const count = state.events.length + 1;
        const newEvent: TimelineEvent = {
          id: uuidv4(),
          start: 0,
          end: state.basic.duration,
          position: state.basic.maleActor ? "missionary position" : "",
          action: state.basic.maleActor ? (state.masterData.partnerActions[3] ?? state.masterData.partnerActions[0]) : state.masterData.soloActions[0],
          clothingState: state.clothing,
          camera: "medium shot",
          expression: "flushed cheeks, slightly open mouth, eyes half-closed",
          additionalDetails: "",
        };
        return { events: fitEvents([...state.events, newEvent], state.basic.duration).slice(0, count) };
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
        return preset ? structuredClone(preset.snapshot) : {};
      }),
      deletePreset: (id) => set((state) => ({ savedPresets: state.savedPresets.filter((item) => item.id !== id) })),
      addMasterItem: (category, value) => set((state) => {
        const clean = value.trim();
        const items = state.masterData[category];
        if (!clean || items.some((item) => item.toLocaleLowerCase() === clean.toLocaleLowerCase())) return {};
        return { masterData: { ...state.masterData, [category]: [...items, clean] } };
      }),
      updateMasterItem: (category, index, value) => set((state) => {
        const clean = value.trim();
        const items = state.masterData[category];
        if (!clean || items.some((item, itemIndex) => itemIndex !== index && item.toLocaleLowerCase() === clean.toLocaleLowerCase())) return {};
        return { masterData: { ...state.masterData, [category]: items.map((item, itemIndex) => itemIndex === index ? clean : item) } };
      }),
      removeMasterItem: (category, index) => set((state) => {
        const items = state.masterData[category];
        if (items.length <= 1) return {};
        return { masterData: { ...state.masterData, [category]: items.filter((_, itemIndex) => itemIndex !== index) } };
      }),
      resetMasterData: () => set({ masterData: structuredClone(DEFAULT_MASTER_DATA) }),
      resetAll: () => set((state) => ({ ...structuredClone(initialSnapshot), savedPresets: state.savedPresets, masterData: state.masterData })),
    }),
    { name: "frameforge-h3-adult-prompt-storage", version: 1 },
  ),
);
