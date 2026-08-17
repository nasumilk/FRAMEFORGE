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
  const basic = usePromptStore((state) => state.basic);
  const mode = basic.mode;
  const isI2V = mode === "I2V";
  const isExtend = mode === "EXTEND";
  const isContinuation = isI2V || isExtend;
  const sourceCameraLocked = (isI2V && basic.i2vCameraSource === "reference-image") || (isExtend && basic.extendCameraSource === "continue");
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
        <div><span className="event-number">{isExtend ? (language === "JAP" ? "延長ビート" : "CONTINUATION BEAT") : isI2V ? (language === "JAP" ? "連続モーション" : "MOTION PHASE") : `SHOT ${event.shotNumber}`} · {t.event} {String(index + 1).padStart(2, "0")}</span><strong>{event.start.toFixed(1)} – {event.end.toFixed(1)}s</strong></div>
        <button className="icon-button danger" onClick={onRemove} aria-label={`${t.deleteEvent} ${index + 1}`}><Trash2 size={16} /></button>
      </div>

      <div className="event-grid event-meta-grid">
        {!isContinuation && <Field label={label("Shot", "ショット")}><input type="number" min={1} max={99} value={event.shotNumber} onChange={(e) => onUpdate({ shotNumber: Math.max(1, Number(e.target.value)) })} /></Field>}
        <Field label={t.start}><input type="number" min={0} max={duration} step={0.1} value={event.start} onChange={(e) => onUpdate({ start: Number(e.target.value) })} /></Field>
        <Field label={t.end}><input type="number" min={0} max={duration} step={0.1} value={event.end} onChange={(e) => onUpdate({ end: Number(e.target.value) })} /></Field>
        {!isContinuation && <SelectField label={label("Transition", "トランジション")} value={event.transition} options={master.shotTransitions} onChange={(transition) => onUpdate({ transition })} />}
      </div>

      <section className="track-panel subject-track">
        <div className="track-title"><UserRound size={14} /><span>{label("SUBJECT TRACK", "被写体トラック")}</span></div>
        <div className="event-grid">
          <SelectField label={label("Woman pose (Auto recommended)", "女性ポーズ（自動推奨）")} value={event.pose} options={master.poses} onChange={(pose) => onUpdate({ pose })} />
          <SelectField label={label("Main woman's body orientation", "メイン女性の体の向き")} value={event.bodyOrientation} options={master.bodyOrientations} onChange={(bodyOrientation) => onUpdate({ bodyOrientation, visualCameraPoint: undefined, visualBodyDirection: undefined })} />
          <SelectField label={label("Face / upper-body orientation", "顔・上半身の向き")} value={event.upperBodyOrientation} options={master.upperBodyOrientations} onChange={(upperBodyOrientation) => onUpdate({ upperBodyOrientation, visualCameraPoint: undefined, visualBodyDirection: undefined })} />
          <SelectField label={label("Hip orientation", "腰の向き")} value={event.hipOrientation} options={master.hipOrientations} onChange={(hipOrientation) => onUpdate({ hipOrientation, visualCameraPoint: undefined, visualBodyDirection: undefined })} />
          <SelectField label={t.clothingState} value={event.clothingState} options={master.clothings} onChange={(clothingState) => onUpdate({ clothingState })} />
          {partnered && <SelectField label={sceneType === "female-female" ? label("Women-couple position", "女性同士の体位") : label("Couple position", "カップルの体位")} value={event.position} options={positions} onChange={(position) => onUpdate({ position })} />}
          {sceneType === "male-female" && <SelectField label={label("Intimacy mode", "接触モード")} value={event.intimacyMode} options={INTIMACY_OPTIONS} onChange={(intimacyMode) => onUpdate({ intimacyMode: intimacyMode as TimelineEvent["intimacyMode"] })} />}
          <SelectField label={t.action} value={event.action} options={actions} onChange={(action) => onUpdate({ action })} />
          {partnered && <SelectField label={sceneType === "female-female" ? label("Second woman's hand action", "2人目の女性の手の動作") : label("Male partner hand action", "男優の手の動作")} value={event.partnerHandAction} options={master.partnerHandActions} onChange={(partnerHandAction) => onUpdate({ partnerHandAction })} />}
          <SelectField label={t.expression} value={event.expression} options={master.expressions} onChange={(expression) => onUpdate({ expression })} />
          <SelectField label={label("Woman's performance tone", "女性の演技トーン")} value={event.performanceTone} options={master.performanceTones} onChange={(performanceTone) => onUpdate({ performanceTone })} />
          {partnered && <SelectField label={label("Consent direction", "同意の演出")} value={event.consentDirection} options={master.consentDirections} onChange={(consentDirection) => onUpdate({ consentDirection })} />}
          <SelectField label={label("Perspiration", "汗の表現")} value={event.perspirationEffect} options={master.perspirationEffects} onChange={(perspirationEffect) => onUpdate({ perspirationEffect })} />
          <SelectField label={label("Lotion", "ローションの表現")} value={event.lotionEffect} options={master.lotionEffects} onChange={(lotionEffect) => onUpdate({ lotionEffect })} />
          <SelectField label={label("Lactation", "母乳の表現")} value={event.lactationEffect} options={master.lactationEffects} onChange={(lactationEffect) => onUpdate({ lactationEffect })} />
          <Field
            label={label("Exact Japanese dialogue (optional)", "日本語のセリフ（任意・入力文のみ発話）")}
            hint={label("Leave blank for breathing, gasps, and moans only.", "空欄の場合は吐息・息をのむ声・喘ぎ声だけになります。")}
          >
            <input value={event.dialogueText} onChange={(e) => onUpdate({ dialogueText: e.target.value })} placeholder={label("Enter the exact line to be spoken", "発話させるセリフをそのまま入力")} />
          </Field>
          {event.dialogueText.trim() && <SelectField label={label("Dialogue delivery", "セリフの話し方")} value={event.dialogueDelivery} options={master.dialogueDeliveries} onChange={(dialogueDelivery) => onUpdate({ dialogueDelivery })} />}
          <SelectField label={label("Adult toy", "大人向けトイ")} value={event.adultToy} options={master.adultToys} onChange={(adultToy) => onUpdate({ adultToy })} />
        </div>
      </section>

      {sourceCameraLocked ? <section className="track-panel camera-track">
        <div className="track-title"><Video size={14} /><span>{label("CAMERA LOCK", "カメラ固定")}</span></div>
        <span className="field-hint">{isExtend
          ? label("The source clip supplies the camera path, speed, amplitude, lens perspective, and composition. Controls are hidden because Continue exact source movement is selected.", "延長元のカメラ軌道・速度・振幅・レンズ感・構図をそのまま継続します。「延長元の動きを継続」が選択されているため、カメラ設定は非表示です。")
          : label("The first frame supplies camera position, lens perspective, crop, focus look, and composition. Camera controls are hidden because Preserve reference composition is selected.", "参照画像のカメラ位置・レンズ感・クロップ・フォーカス表現・構図をそのまま使用します。「参照画像の構図を維持」が選択されているため、カメラ設定は非表示です。")}</span>
      </section> : <section className="track-panel camera-track">
        <div className="track-title"><Video size={14} /><span>{label("CAMERA TRACK", "カメラトラック")}</span></div>
        <div className="event-grid">
          <SelectField label={label("Camera position relative to woman", "女性に対するカメラ位置")} value={event.cameraPlacement} options={master.cameraPlacements} onChange={(cameraPlacement) => onUpdate({ cameraPlacement, visualCameraPoint: undefined, visualBodyDirection: undefined })} />
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
        {mode === "T2V" && <span className="field-hint">{label("T2V automatically keeps directional camera angles and camera positions compatible.", "T2Vでは方向付きの画角とカメラ位置を自動的に整合させます。")}</span>}
      </section>}

      {sceneType === "male-female" && <button type="button" className="secondary-button" onClick={() => onUpdate({
        position: "rear-entry position",
        pose: "on all fours with an arched back",
        bodyOrientation: "facing the camera while the head and eyes look directly into the lens",
        upperBodyOrientation: "face, shoulders, and chest oriented directly toward the camera",
        hipOrientation: "hips directed away from the camera toward the partner behind her",
        cameraPlacement: "camera positioned directly in front of the primary woman at her eye level while she is on all fours",
        camera: "eye-level angle",
        partnerHandAction: "both hands firmly supporting the adult woman's hips",
      })}>{label("Apply front-camera rear-entry setup", "正面カメラ後背位セットを適用")}</button>}

      <Field label={t.additionalDirection}><input value={event.additionalDetails} onChange={(e) => onUpdate({ additionalDetails: e.target.value })} placeholder={t.directionPlaceholder} /></Field>
    </article>
  );
}
