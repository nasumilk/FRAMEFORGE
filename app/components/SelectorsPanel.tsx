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
      <label className="switch-row capture-switch"><span>{label(basic.mode === "I2V" ? "Prompt optimizer (disabled for identity fidelity)" : "Prompt optimizer", basic.mode === "I2V" ? "プロンプト最適化（人物維持のためI2Vでは無効）" : "プロンプト最適化")}</span><input type="checkbox" disabled={basic.mode === "I2V"} checked={basic.mode === "I2V" ? false : basic.promptOptimizer} onChange={(event) => setBasic({ promptOptimizer: event.target.checked })} /></label>
      <label className="switch-row capture-switch"><span>{label("Fast pretreatment", "高速前処理")}</span><input type="checkbox" checked={basic.fastPretreatment} onChange={(event) => setBasic({ fastPretreatment: event.target.checked })} /></label>

      {basic.mode !== "T2V" && <>
        <div className="section-label"><Image size={14} /> {label("Reference frames", "参照画像")}</div>
        {(basic.mode === "I2V" || basic.mode === "FLF") && <Field label={label("First-frame image URL or Data URI", "開始フレーム画像URL / Data URI")}><input value={basic.firstFrameImage} onChange={(event) => setBasic({ firstFrameImage: event.target.value })} placeholder="https://…" /></Field>}
        {basic.mode === "I2V" && <div className="nested-settings">
          <Field label={label("Clothing starts from", "衣服の開始基準")}>
            <select value={basic.i2vClothingStartSource} onChange={(event) => setBasic({ i2vClothingStartSource: event.target.value as typeof basic.i2vClothingStartSource })}>
              <option value="reference-image">{label("Reference image → selected state", "参照画像 → 指定状態へ自然に移行")}</option>
              <option value="prompt">{label("Prompt-selected state", "プロンプトの指定状態を優先")}</option>
            </select>
          </Field>
          <Field label={label("Pose / position starts from", "ポーズ・体位の開始基準")}>
            <select value={basic.i2vPoseStartSource} onChange={(event) => setBasic({ i2vPoseStartSource: event.target.value as typeof basic.i2vPoseStartSource })}>
              <option value="reference-image">{label("Reference image → selected pose", "参照画像 → 指定ポーズへ自然に移行")}</option>
              <option value="prompt">{label("Prompt-selected pose", "プロンプトの指定ポーズ・体位を優先")}</option>
            </select>
          </Field>
          <Field label={label("Background source", "背景の基準")}>
            <select value={basic.i2vBackgroundSource} onChange={(event) => setBasic({ i2vBackgroundSource: event.target.value as typeof basic.i2vBackgroundSource })}>
              <option value="reference-image">{label("Preserve reference background", "参照画像の背景を維持")}</option>
              <option value="prompt">{label("Transition toward prompt scene", "プロンプトの場面へ移行")}</option>
            </select>
          </Field>
          <Field label={label("Camera source", "カメラの基準")}>
            <select value={basic.i2vCameraSource} onChange={(event) => setBasic({ i2vCameraSource: event.target.value as typeof basic.i2vCameraSource })}>
              <option value="reference-image">{label("Preserve reference composition", "参照画像の構図を維持")}</option>
              <option value="prompt">{label("Use relative prompt camera move", "プロンプトの相対カメラ移動を使用")}</option>
            </select>
          </Field>
          <Field label={label("Motion intensity", "動きの強さ")}>
            <select value={basic.i2vMotionIntensity} onChange={(event) => setBasic({ i2vMotionIntensity: event.target.value as typeof basic.i2vMotionIntensity })}>
              <option value="subtle">{label("Subtle — best identity", "控えめ — 人物維持を優先")}</option>
              <option value="moderate">{label("Moderate — balanced", "中程度 — バランス")}</option>
              <option value="strong">{label("Strong — higher drift risk", "強い — 変化リスクあり")}</option>
            </select>
          </Field>
          <Field label={label("Transition timing", "遷移タイミング")}>
            <select value={basic.i2vTransitionTiming} onChange={(event) => setBasic({ i2vTransitionTiming: event.target.value as typeof basic.i2vTransitionTiming })}>
              <option value="slow">{label("Slow transition", "ゆっくり移行")}</option>
              <option value="balanced">{label("Balanced transition", "標準的に移行")}</option>
              <option value="fast">{label("Early transition", "早めに移行")}</option>
            </select>
          </Field>
          <span className="field-hint">{label("The reference image always remains authoritative for identity and the exact 0.00-second frame.", "人物同一性と0.00秒のフレームは常に参照画像を最優先します。")}</span>
        </div>}
        {basic.mode === "FLF" && <Field label={label("Last-frame image URL or Data URI", "終了フレーム画像URL / Data URI")}><input value={basic.lastFrameImage} onChange={(event) => setBasic({ lastFrameImage: event.target.value })} placeholder="https://…" /></Field>}
        {basic.mode === "S2V" && <Field label={label("Subject-reference image URL", "被写体参照画像URL")}><input value={basic.subjectReferenceImage} onChange={(event) => setBasic({ subjectReferenceImage: event.target.value })} placeholder="https://…" /></Field>}
      </>}

      {basic.mode === "I2V" ? <>
        <div className="section-label"><ShieldCheck size={14} /> {label("I2V preservation policy", "I2V維持ポリシー")}</div>
        <div className="i2v-reference-notice">
          <strong>{label("Reference locks are enforced", "参照維持ロックは常時有効です")}</strong>
          <span>{label("Identity and anatomy are always locked. Wardrobe, background, and camera follow the I2V source choices above. T2V capture-device and continuity settings are intentionally excluded.", "人物同一性と身体構造は常に固定します。衣服・背景・カメラは上のI2V基準設定に従います。T2V用の撮影機材・連続性設定は意図的に除外しています。")}</span>
        </div>
      </> : <>
      <div className="section-label"><Camera size={14} /> {t.captureSetup}</div>
      <SelectField label={t.cameraDevice} value={basic.captureDevice} options={master.captureDevices} onChange={(captureDevice) => setBasic({ captureDevice })} />
      <label className="switch-row capture-switch">
        <span>{label("Convert optional numeric camera hints", "数値カメラ指定を視覚表現へ変換")}</span>
        <input type="checkbox" checked={basic.useNumericCameraHints} onChange={(event) => setBasic({ useNumericCameraHints: event.target.checked })} />
      </label>
      {basic.useNumericCameraHints && <>
        <span className="field-hint">{label("Numbers are not emitted; they are translated into visual framing and lens-look descriptions.", "数値は出力せず、構図とレンズの見え方を表す文章へ変換します。")}</span>
        <SelectField label={label("Optional lens-look hint", "補助的なレンズ表現")} value={basic.focalLength} options={master.focalLengths} onChange={(focalLength) => setBasic({ focalLength })} />
        <SelectField label={label("Optional framing-distance hint", "補助的な距離・構図表現")} value={basic.subjectDistance} options={master.subjectDistances} onChange={(subjectDistance) => setBasic({ subjectDistance })} />
      </>}
      <label className="switch-row capture-switch">
        <span>{label("Recommend Reference Video for precise camera work", "正確なカメラワークにはReference Videoを推奨")}</span>
        <input type="checkbox" checked={basic.includeReferenceVideoNote} onChange={(event) => setBasic({ includeReferenceVideoNote: event.target.checked })} />
      </label>
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
      </>}

      <div className="section-label"><AudioLines size={14} /> {t.soundDesign}</div>
      <SelectField label={t.soundPreset} value={soundscape} options={master.soundPresets} onChange={setSoundscape} />
      <Field label={t.customSoundscape}><textarea rows={3} value={soundscape} onChange={(event) => setSoundscape(event.target.value)} /></Field>
      <SelectField label={t.music} value={music} options={master.musicOptions} onChange={setMusic} />

      <Field label={basic.mode === "I2V" ? label("Additional motion direction", "追加モーション指示") : t.globalNotes} hint={basic.mode === "I2V" ? label("Appended as a subordinate motion-only instruction; it cannot override the reference locks.", "参照維持ロックより下位のモーション専用指示として追加します。") : t.notesHint}>
        <textarea rows={4} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} placeholder={t.notesPlaceholder} />
      </Field>
    </aside>
  );
}
