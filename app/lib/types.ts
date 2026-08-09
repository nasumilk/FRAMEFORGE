export type Mode = "T2V" | "I2V";
export type UiLanguage = "ENG" | "JAP";

export type AgeValue =
  | { kind: "exact"; value: number }
  | { kind: "range"; min: number; max: number };

export interface BasicSettings {
  mode: Mode;
  age: AgeValue;
  bodyType: string;
  hair: string;
  eyes: string;
  skin: string;
  maleActor: boolean;
  maleBodyType: string;
  maleAgeFeel: string;
  maleFaceVisible: boolean;
  duration: number;
  style: string;
  lighting: string;
}

export interface TimelineEvent {
  id: string;
  start: number;
  end: number;
  position: string;
  action: string;
  clothingState: string;
  camera: string;
  expression: string;
  additionalDetails: string;
}

export interface PromptSnapshot {
  basic: BasicSettings;
  situation: string;
  clothing: string;
  events: TimelineEvent[];
  soundscape: string;
  music: string;
  customNotes: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  snapshot: PromptSnapshot;
}

export interface MasterItem {
  value: string;
  japanese: string;
}

export interface MasterData {
  bodyTypes: MasterItem[];
  hairStyles: MasterItem[];
  eyeStyles: MasterItem[];
  skinOptions: MasterItem[];
  situations: MasterItem[];
  clothings: MasterItem[];
  positions: MasterItem[];
  partnerActions: MasterItem[];
  soloActions: MasterItem[];
  cameras: MasterItem[];
  expressions: MasterItem[];
  soundPresets: MasterItem[];
  musicOptions: MasterItem[];
  stylePresets: MasterItem[];
  lightingOptions: MasterItem[];
  maleBodyTypes: MasterItem[];
  maleAgeFeels: MasterItem[];
}

export type MasterCategory = keyof MasterData;
