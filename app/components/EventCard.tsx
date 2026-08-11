"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, UserRound, Video, Trash2 } from "lucide-react";
import type { MasterItem, SceneType, TimelineEvent } from "../lib/types";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";
import { MALE_POV_CAMERA } from "../lib/constants";

const INTIMACY_OPTIONS: MasterItem[] = [
  { value: "standard intimate contact", japanese: "通常の親密な接触" },
  { value: "consensual anal intercourse", japanese: "合意のある成人同士のアナル性交" },
];

export function EventCard({ event, index, duration, sceneType, onUpdate, onRemove }: {
  event: TimelineEvent; index: number; duration: number; sceneType: SceneType;
  onUpdate: (data: Partial<TimelineEvent>) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const master = usePromptStore((state) => state.masterData);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const partnered = sceneType !== "solo";
  const actions = sceneType === "female-female" ? master.lesbianActions : sceneType === "male-female" ? master.partnerActions : master.soloActions;
  const positions = sceneType === "female-female" ? master.lesbianPositions : master.positions;
  const cameraOptions = sceneType === "male-female" ? master.cameras : master.cameras.filter((camera) => camera.value !== MALE_POV_CAMERA);
  const invalid = event.start < 0 || event.end > duration || event.end <= event.start;
  const label = (eng: string, jap: string) => language === "JAP" ? jap : eng;

  return (
    <article ref={setNodeRef} style={style} className={`event-card ${isDragging ? "dragging" : ""} ${invalid ? "invalid" : ""}`}>
      <div className="event-head">
        <button className="drag-handle" aria-label={`${t.dragEvent} ${index + 1}`} {...attributes} {...listeners}><GripVertical size={18} /></button>
        <div><span className="event-number">SHOT {event.shotNumber} · {t.event} {String(index + 1).padStart(2, "0")}</span><strong>{event.start.toFixed(1)} – {event.end.toFixed(1)}s</strong></div>
        <button className="icon-button danger" onClick={onRemove} aria-label={`${t.deleteEvent} ${index + 1}`}><Trash2 size={16} /></button>
      </div>

      <div className="event-grid event-meta-grid">
        <Field label={label("Shot", "ショット")}><input type="number" min={1} max={99} value={event.shotNumber} onChange={(e) => onUpdate({ shotNumber: Math.max(1, Number(e.target.value)) })} /></Field>
        <Field label={t.start}><input type="number" min={0} max={duration} step={0.1} value={event.start} onChange={(e) => onUpdate({ start: Number(e.target.value) })} /></Field>
        <Field label={t.end}><input type="number" min={0} max={duration} step={0.1} value={event.end} onChange={(e) => onUpdate({ end: Number(e.target.value) })} /></Field>
        <SelectField label={label("Transition", "トランジション")} value={event.transition} options={master.shotTransitions} onChange={(transition) => onUpdate({ transition })} />
      </div>

      <section className="track-panel subject-track">
        <div className="track-title"><UserRound size={14} /><span>{label("SUBJECT TRACK", "被写体トラック")}</span></div>
        <div className="event-grid">
          <SelectField label={label("Woman pose (Auto recommended)", "女性ポーズ（自動推奨）")} value={event.pose} options={master.poses} onChange={(pose) => onUpdate({ pose })} />
          <SelectField label={t.clothingState} value={event.clothingState} options={master.clothings} onChange={(clothingState) => onUpdate({ clothingState })} />
          {partnered && <SelectField label={sceneType === "female-female" ? label("Women-couple position", "女性同士の体位") : label("Couple position", "カップルの体位")} value={event.position} options={positions} onChange={(position) => onUpdate({ position })} />}
          {sceneType === "male-female" && <SelectField label={label("Intimacy mode", "接触モード")} value={event.intimacyMode} options={INTIMACY_OPTIONS} onChange={(intimacyMode) => onUpdate({ intimacyMode: intimacyMode as TimelineEvent["intimacyMode"] })} />}
          <SelectField label={t.action} value={event.action} options={actions} onChange={(action) => onUpdate({ action })} />
          {partnered && <SelectField label={sceneType === "female-female" ? label("Second woman's hand action", "2人目の女性の手の動作") : label("Male partner hand action", "男優の手の動作")} value={event.partnerHandAction} options={master.partnerHandActions} onChange={(partnerHandAction) => onUpdate({ partnerHandAction })} />}
          <SelectField label={t.expression} value={event.expression} options={master.expressions} onChange={(expression) => onUpdate({ expression })} />
          <SelectField label={label("Adult toy", "大人向けトイ")} value={event.adultToy} options={master.adultToys} onChange={(adultToy) => onUpdate({ adultToy })} />
        </div>
      </section>

      <section className="track-panel camera-track">
        <div className="track-title"><Video size={14} /><span>{label("CAMERA TRACK", "カメラトラック")}</span></div>
        <div className="event-grid">
          <SelectField label={label("1. Shot size / framing", "1. ショットサイズ・構図")} value={event.shotSize} options={master.shotSizes} onChange={(shotSize) => onUpdate({ shotSize })} />
          <SelectField label={label("2. Visual result", "2. 視覚的な見え方")} value={event.visualResult} options={master.visualResults} onChange={(visualResult) => onUpdate({ visualResult })} />
          <SelectField label={label("3. Camera angle", "3. カメラ角度")} value={event.camera} options={cameraOptions} onChange={(camera) => onUpdate({ camera })} />
          <SelectField label={label("4. Camera motion (one only)", "4. カメラの動き（1つのみ）")} value={event.cameraMotion} options={master.cameraMotions} onChange={(cameraMotion) => onUpdate({ cameraMotion, cameraCommands: [] })} />
          {event.cameraMotion !== "locked-off static" && <SelectField label={label("5. Motion amplitude", "5. 動きの振幅")} value={event.motionAmplitude} options={master.motionAmplitudes} onChange={(motionAmplitude) => onUpdate({ motionAmplitude })} />}
          {event.cameraMotion !== "locked-off static" && <SelectField label={label("6. Motion speed", "6. 動きの速度")} value={event.motionSpeed} options={master.motionSpeeds} onChange={(motionSpeed) => onUpdate({ motionSpeed })} />}
          <SelectField label={label("Depth of field", "被写界深度")} value={event.depthOfField} options={master.depthOfFieldOptions} onChange={(depthOfField) => onUpdate({ depthOfField })} />
          <SelectField label={label("Focus target", "フォーカス対象")} value={event.focusTarget} options={master.focusTargets} onChange={(focusTarget) => onUpdate({ focusTarget })} />
          <SelectField label={label("Focus behavior", "フォーカス動作")} value={event.focusBehavior} options={master.focusBehaviors} onChange={(focusBehavior) => onUpdate({ focusBehavior })} />
          <SelectField label={label("Frame rate", "フレームレート")} value={event.frameRate} options={master.frameRates} onChange={(frameRate) => onUpdate({ frameRate })} />
        </div>
        {event.cameraMotion === "locked-off static" && <span className="field-hint">{label("Static mode automatically forbids push, zoom, dolly, pan, tilt, reframing, and handheld shake.", "固定モードではプッシュ、ズーム、ドリー、パン、チルト、リフレーミング、手振れを自動的に禁止します。")}</span>}
      </section>

      <Field label={t.additionalDirection}><input value={event.additionalDetails} onChange={(e) => onUpdate({ additionalDetails: e.target.value })} placeholder={t.directionPlaceholder} /></Field>
    </article>
  );
}
