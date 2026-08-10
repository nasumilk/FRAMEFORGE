"use client";

import { AudioLines, Camera, Image, MapPin, Settings2, ShieldCheck, Shirt } from "lucide-react";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";
import { RESOLUTIONS, VIDEO_MODELS } from "../lib/constants";

export function SelectorsPanel() {
  const situation = usePromptStore((state) => state.situation);
  const master = usePromptStore((state) => state.masterData);
  const clothing = usePromptStore((state) => state.clothing);
  const soundscape = usePromptStore((state) => state.soundscape);
  const music = usePromptStore((state) => state.music);
  const customNotes = usePromptStore((state) => state.customNotes);
  const basic = usePromptStore((state) => state.basic);
  const setSituation = usePromptStore((state) => state.setSituation);
  const setClothing = usePromptStore((state) => state.setClothing);
  const setSoundscape = usePromptStore((state) => state.setSoundscape);
  const setMusic = usePromptStore((state) => state.setMusic);
  const setCustomNotes = usePromptStore((state) => state.setCustomNotes);
  const setBasic = usePromptStore((state) => state.setBasic);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const label = (eng: string, jap: string) => language === "JAP" ? jap : eng;
  const models = VIDEO_MODELS.filter((model) => {
    if (basic.mode === "FLF") return model === "MiniMax-Hailuo-02";
    if (basic.mode === "S2V") return model === "S2V-01";
    if (basic.mode === "T2V") return model !== "S2V-01" && model !== "MiniMax-Hailuo-2.3-Fast";
    return model !== "S2V-01";
  });
  const resolutions = RESOLUTIONS.filter((resolution) => resolution !== "512P" || (basic.model === "MiniMax-Hailuo-02" && basic.mode !== "FLF"));

  return (
    <aside className="panel content-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><MapPin size={14} /> {t.scene}</div>
        <h2>{t.direction}</h2>
        <p>{t.directionDescription}</p>
      </div>

      <SelectField label={t.situation} value={situation} options={master.situations} onChange={setSituation} />
      <Field label={t.customSituation}><input value={situation} onChange={(event) => setSituation(event.target.value)} placeholder={t.customSituationPlaceholder} /></Field>

      <div className="section-label"><Shirt size={14} /> {t.wardrobe}</div>
      <SelectField label={t.startingClothing} value={clothing} options={master.clothings} onChange={setClothing} />

      <div className="section-label"><Settings2 size={14} /> {label("Generation", "生成設定")}</div>
      <Field label={label("Model", "モデル")}><select value={basic.model} onChange={(event) => setBasic({ model: event.target.value })}>{models.map((model) => <option key={model}>{model}</option>)}</select></Field>
      <Field label={label("Resolution", "解像度")}><select value={basic.resolution} onChange={(event) => setBasic({ resolution: event.target.value as typeof basic.resolution })}>{resolutions.map((resolution) => <option key={resolution}>{resolution}</option>)}</select></Field>
      <label className="switch-row capture-switch"><span>{label("Prompt optimizer", "プロンプト最適化")}</span><input type="checkbox" checked={basic.promptOptimizer} onChange={(event) => setBasic({ promptOptimizer: event.target.checked })} /></label>
      <label className="switch-row capture-switch"><span>{label("Fast pretreatment", "高速前処理")}</span><input type="checkbox" checked={basic.fastPretreatment} onChange={(event) => setBasic({ fastPretreatment: event.target.checked })} /></label>

      {basic.mode !== "T2V" && <>
        <div className="section-label"><Image size={14} /> {label("Reference frames", "参照画像")}</div>
        {(basic.mode === "I2V" || basic.mode === "FLF") && <Field label={label("First-frame image URL or Data URI", "開始フレーム画像URL / Data URI")}><input value={basic.firstFrameImage} onChange={(event) => setBasic({ firstFrameImage: event.target.value })} placeholder="https://…" /></Field>}
        {basic.mode === "FLF" && <Field label={label("Last-frame image URL or Data URI", "終了フレーム画像URL / Data URI")}><input value={basic.lastFrameImage} onChange={(event) => setBasic({ lastFrameImage: event.target.value })} placeholder="https://…" /></Field>}
        {basic.mode === "S2V" && <Field label={label("Subject-reference image URL", "被写体参照画像URL")}><input value={basic.subjectReferenceImage} onChange={(event) => setBasic({ subjectReferenceImage: event.target.value })} placeholder="https://…" /></Field>}
      </>}

      <div className="section-label"><Camera size={14} /> {t.captureSetup}</div>
      <SelectField label={t.cameraDevice} value={basic.captureDevice} options={master.captureDevices} onChange={(captureDevice) => setBasic({ captureDevice })} />
      <SelectField label={t.focalLength} value={basic.focalLength} options={master.focalLengths} onChange={(focalLength) => setBasic({ focalLength })} />
      <SelectField label={t.subjectDistance} value={basic.subjectDistance} options={master.subjectDistances} onChange={(subjectDistance) => setBasic({ subjectDistance })} />
      <label className="switch-row capture-switch">
        <span>{t.naturalHandheld}</span>
        <input type="checkbox" checked={basic.handheldShake} onChange={(event) => setBasic({ handheldShake: event.target.checked })} />
      </label>
      {basic.handheldShake && <SelectField label={t.shakeStyle} value={basic.handheldStyle} options={master.handheldStyles} onChange={(handheldStyle) => setBasic({ handheldStyle })} />}

      <div className="section-label"><ShieldCheck size={14} /> {label("Continuity locks", "連続性・破綻防止")}</div>
      <div className="continuity-grid">
        {([
          ["preserveIdentity", "Identity", "人物同一性"], ["preserveWardrobe", "Wardrobe", "衣装"],
          ["stabilizeAnatomy", "Anatomy / hands", "人体・手指"], ["stabilizeBackground", "Background", "背景"],
          ["preserveLighting", "Lighting", "照明"], ["preventCameraTeleport", "Camera path", "カメラ軌道"],
          ["continuousTake", "No unintended cuts", "意図しないカット禁止"],
        ] as const).map(([key, eng, jap]) => <label className="check-row" key={key}><input type="checkbox" checked={basic[key]} onChange={(event) => setBasic({ [key]: event.target.checked })} /><span>{label(eng, jap)}</span></label>)}
      </div>

      <div className="section-label"><AudioLines size={14} /> {t.soundDesign}</div>
      <SelectField label={t.soundPreset} value={soundscape} options={master.soundPresets} onChange={setSoundscape} />
      <Field label={t.customSoundscape}><textarea rows={3} value={soundscape} onChange={(event) => setSoundscape(event.target.value)} /></Field>
      <SelectField label={t.music} value={music} options={master.musicOptions} onChange={setMusic} />

      <Field label={t.globalNotes} hint={t.notesHint}>
        <textarea rows={4} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} placeholder={t.notesPlaceholder} />
      </Field>
    </aside>
  );
}
