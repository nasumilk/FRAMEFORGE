"use client";

import { useMemo, useState } from "react";
import { Camera, Crosshair, Scan, SlidersHorizontal } from "lucide-react";
import type { SceneType, TimelineEvent, UiLanguage } from "../lib/types";
import {
  CAMERA_HEIGHTS,
  CAMERA_MOVES,
  CAMERA_POINTS,
  FRAMINGS,
  VISUAL_POSE_PRESETS,
  inferVisualCameraPoint,
  linkedCameraPatch,
  visualPoseForEvent,
  type VisualOption,
} from "../lib/visualComposer";
import { Interactive3DStage } from "./Interactive3DStage";

function OptionStrip({ title, icon, options, activeId, language, onSelect }: {
  title: string;
  icon: React.ReactNode;
  options: VisualOption[];
  activeId?: string;
  language: UiLanguage;
  onSelect: (option: VisualOption) => void;
}) {
  return (
    <div className="visual-control-group">
      <div className="visual-control-label">{icon}<span>{title}</span></div>
      <div className="visual-chip-row">
        {options.map((option) => (
          <button key={option.id} type="button" className={activeId === option.id ? "active" : ""} onClick={() => onSelect(option)}>
            {option.label[language]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VisualComposer({
  events,
  sceneType,
  language,
  onUpdate,
  onSwitchManual,
}: {
  events: TimelineEvent[];
  sceneType: SceneType;
  language: UiLanguage;
  onUpdate: (id: string, patch: Partial<TimelineEvent>) => void;
  onSwitchManual: () => void;
}) {
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "");
  const selected = events.find((event) => event.id === selectedId) ?? events[0];

  const poseOptions = useMemo(() => VISUAL_POSE_PRESETS.filter((preset) => preset.scenes.includes(sceneType)), [sceneType]);
  if (!selected) return null;
  const activePose = visualPoseForEvent(selected, sceneType);
  const storedCameraPoint = CAMERA_POINTS.find((option) => option.id === selected.visualCameraPoint && option.patch.cameraPlacement === selected.cameraPlacement)?.id;
  const cameraPoint = storedCameraPoint ?? inferVisualCameraPoint(selected.cameraPlacement);
  const storedCameraHeight = CAMERA_HEIGHTS.find((option) => option.id === selected.visualCameraHeight && option.patch.camera === selected.camera)?.id;
  const cameraHeight = storedCameraHeight ?? (selected.camera === "low angle" ? "low" : selected.camera === "slight high angle" ? "high" : "eye");
  const storedFraming = FRAMINGS.find((option) => option.id === selected.visualFraming && option.patch.shotSize === selected.shotSize)?.id;
  const framing = storedFraming ?? (selected.shotSize.startsWith("close") ? "close" : selected.shotSize.includes("waist") ? "waist" : selected.shotSize.includes("knees") ? "knees" : selected.shotSize.includes("establishing") ? "wide" : "full");
  const motion = CAMERA_MOVES.find((option) => option.patch.cameraMotion === selected.cameraMotion)?.id ?? "static";
  const update = (patch: Partial<TimelineEvent>) => onUpdate(selected.id, patch);
  const copy = language === "JAP" ? {
    event: "編集するイベント",
    pose: "姿勢・体位",
    cameraMap: "カメラ設置ポイント",
    front: "女性の正面",
    drag: "横・縦ドラッグで3D回転 / ホイールで拡大",
    reset: "視点リセット",
    viewOnly: "3D視点の回転はプロンプトへ影響しません",
    direction: "体の向き",
    height: "カメラ高",
    framing: "構図",
    motion: "カメラ移動",
    mapped: "プロンプトへ反映される内容",
    manual: "Manualで詳細調整",
    primary: "メイン女性",
    partner: sceneType === "female-female" ? "二人目の女性" : "相手役",
  } : {
    event: "EVENT TO EDIT",
    pose: "POSE / POSITION",
    cameraMap: "CAMERA PLACEMENT",
    front: "PRIMARY FRONT",
    drag: "DRAG H/V TO ORBIT • WHEEL TO ZOOM",
    reset: "Reset view",
    viewOnly: "Orbit view does not change the prompt",
    direction: "BODY DIRECTION",
    height: "CAMERA HEIGHT",
    framing: "FRAMING",
    motion: "CAMERA MOTION",
    mapped: "MAPPED PROMPT DIRECTION",
    manual: "Fine-tune in Manual",
    primary: "Primary woman",
    partner: sceneType === "female-female" ? "Second woman" : "Partner",
  };

  return (
    <section className="visual-composer" aria-label={language === "JAP" ? "ビジュアル構図エディター" : "Visual composition editor"}>
      <div className="visual-event-picker">
        <span>{copy.event}</span>
        <div>
          {events.map((event, index) => (
            <button type="button" key={event.id} className={selected.id === event.id ? "active" : ""} onClick={() => setSelectedId(event.id)}>
              <b>{index + 1}</b><small>{event.start}–{event.end}s</small>
            </button>
          ))}
        </div>
      </div>

      <div className="visual-pose-picker">
        <div className="visual-section-heading"><Scan size={15} /><span>{copy.pose}</span></div>
        <div className="visual-preset-grid">
          {poseOptions.map((preset) => (
            <button key={preset.id} type="button" className={activePose.id === preset.id ? "active" : ""} onClick={() => update({ ...preset.patch, visualPosePreset: preset.id, ...linkedCameraPatch(cameraPoint) })}>
              <span>{preset.label[language]}</span><small>{preset.description[language]}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="visual-stage-grid">
        <Interactive3DStage
          pose={activePose}
          sceneType={sceneType}
          language={language}
          cameraPoint={cameraPoint}
          cameraHeight={cameraHeight}
          framing={framing}
          bodyDirection="front"
          labels={{ title: copy.cameraMap, primary: copy.primary, partner: copy.partner, drag: copy.drag, reset: copy.reset, front: copy.front, viewOnly: copy.viewOnly }}
          onSelectCamera={(id) => {
            update(linkedCameraPatch(id));
          }}
        />

        <div className="visual-controls">
          <OptionStrip title={copy.height} icon={<Camera size={15} />} options={CAMERA_HEIGHTS} activeId={cameraHeight} language={language} onSelect={(option) => update(option.patch)} />
          <OptionStrip title={copy.framing} icon={<Scan size={15} />} options={FRAMINGS} activeId={framing} language={language} onSelect={(option) => update(option.patch)} />
          <OptionStrip title={copy.motion} icon={<Crosshair size={15} />} options={CAMERA_MOVES} activeId={motion} language={language} onSelect={(option) => update(option.patch)} />
          <div className="visual-mapping-summary">
            <span>{copy.mapped}</span>
            <p><b>POSE</b>{selected.pose}</p>
            {selected.position && <p><b>POSITION</b>{selected.position}</p>}
            <p><b>ACTION</b>{selected.action}</p>
            {sceneType === "male-female" && <p><b>PARTNER HANDS</b>{selected.partnerHandAction}</p>}
            <p><b>CAMERA</b>{selected.cameraPlacement}</p>
            <p><b>BODY</b>{selected.bodyOrientation}</p>
            <p><b>FRAME</b>{selected.shotSize}</p>
          </div>
          <button type="button" className="visual-manual-link" onClick={onSwitchManual}><SlidersHorizontal size={15} />{copy.manual}</button>
        </div>
      </div>
    </section>
  );
}
