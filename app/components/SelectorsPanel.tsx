"use client";

import { AudioLines, Camera, Film, Image, MapPin, ShieldCheck, Shirt } from "lucide-react";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";

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

  return (
    <aside className="panel content-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><MapPin size={14} /> {basic.mode === "EXTEND" ? label("CONTINUATION", "動画延長") : t.scene}</div>
        <h2>{basic.mode === "EXTEND" ? label("Continue from the source tail", "延長元の末尾から続ける") : t.direction}</h2>
        <p>{basic.mode === "EXTEND"
          ? label("The local video or its final frame is authoritative. Describe only the next one or two beats.", "ローカル動画または最終フレームを基準に、次の1〜2ビートだけを指定します。")
          : t.directionDescription}</p>
      </div>

      {basic.mode === "T2V" && <>
        <SelectField label={t.situation} value={situation} options={master.situations} onChange={setSituation} />
        <Field label={t.customSituation}><input value={situation} onChange={(event) => setSituation(event.target.value)} placeholder={t.customSituationPlaceholder} /></Field>
        <div className="section-label"><Shirt size={14} /> {t.wardrobe}</div>
        <SelectField label={t.startingClothing} value={clothing} options={master.clothings} onChange={setClothing} />
      </>}

      {basic.mode === "I2V" && <>
        <div className="section-label"><Image size={14} /> {label("Local source image", "ローカル参照画像")}</div>
        <div className="i2v-reference-notice">
          <ShieldCheck size={16} />
          <span>{label("Select the source image in your local H3 Studio or ComfyUI workflow. FRAMEFORGE generates only the motion prompt and never requires an image URL.", "参照画像はローカルのH3 StudioまたはComfyUIワークフローで選択します。FRAMEFORGEはモーション用プロンプトだけを生成し、画像URLは要求しません。")}</span>
        </div>
        <div className="nested-settings">
          <Field label={label("Clothing starts from", "衣服の開始基準")}><select value={basic.i2vClothingStartSource} onChange={(event) => setBasic({ i2vClothingStartSource: event.target.value as typeof basic.i2vClothingStartSource })}>
            <option value="reference-image">{label("Reference image → selected state", "参照画像 → 指定状態へ自然に移行")}</option>
            <option value="prompt">{label("Prompt-selected state", "プロンプトの指定状態を優先")}</option>
          </select></Field>
          <Field label={label("Pose / position starts from", "ポーズ・体位の開始基準")}><select value={basic.i2vPoseStartSource} onChange={(event) => setBasic({ i2vPoseStartSource: event.target.value as typeof basic.i2vPoseStartSource })}>
            <option value="reference-image">{label("Reference image → selected pose", "参照画像 → 指定ポーズへ自然に移行")}</option>
            <option value="prompt">{label("Prompt-selected pose", "プロンプトの指定ポーズ・体位を優先")}</option>
          </select></Field>
          <Field label={label("Background source", "背景の基準")}><select value={basic.i2vBackgroundSource} onChange={(event) => setBasic({ i2vBackgroundSource: event.target.value as typeof basic.i2vBackgroundSource })}>
            <option value="reference-image">{label("Preserve reference background", "参照画像の背景を維持")}</option>
            <option value="prompt">{label("Transition toward prompt scene", "指定した場面へ移行")}</option>
          </select></Field>
          <Field label={label("Camera source", "カメラの基準")}><select value={basic.i2vCameraSource} onChange={(event) => setBasic({ i2vCameraSource: event.target.value as typeof basic.i2vCameraSource })}>
            <option value="reference-image">{label("Preserve reference composition", "参照画像の構図を維持")}</option>
            <option value="prompt">{label("Use relative prompt camera move", "指定した相対カメラ移動を使用")}</option>
          </select></Field>
          <Field label={label("Motion intensity", "動きの強さ")}><select value={basic.i2vMotionIntensity} onChange={(event) => setBasic({ i2vMotionIntensity: event.target.value as typeof basic.i2vMotionIntensity })}>
            <option value="subtle">{label("Subtle (best identity fidelity)", "控えめ（人物維持を優先）")}</option>
            <option value="moderate">{label("Moderate", "中程度")}</option>
            <option value="strong">{label("Strong", "強い")}</option>
          </select></Field>
          <Field label={label("Transition timing", "移行速度")}><select value={basic.i2vTransitionTiming} onChange={(event) => setBasic({ i2vTransitionTiming: event.target.value as typeof basic.i2vTransitionTiming })}>
            <option value="slow">{label("Slow", "ゆっくり")}</option><option value="balanced">{label("Balanced", "標準")}</option><option value="fast">{label("Fast", "速い")}</option>
          </select></Field>
        </div>
      </>}

      {basic.mode === "EXTEND" && <>
        <div className="section-label"><Film size={14} /> {label("Continuation source", "延長元の指定")}</div>
        <Field label={label("Reference method", "参照方式")} hint={label("Choose the reference that your local ComfyUI workflow will supply.", "ローカルComfyUIワークフローに渡す参照方式を選びます。") }>
          <select value={basic.extendMethod} onChange={(event) => setBasic({ extendMethod: event.target.value as typeof basic.extendMethod })}>
            <option value="video-reference">{label("Video reference (recommended)", "動画参照（推奨）")}</option>
            <option value="last-frame">{label("Final frame as next first frame", "最終フレームを次の開始画像にする")}</option>
            <option value="motion-context">{label("ComfyUI Motion Context / latent tail", "ComfyUI Motion Context／潜在末尾")}</option>
          </select>
        </Field>
        <Field label={label("Source clip final state", "延長元の最終状態")} hint={label("Who is visible, current pose/position, clothing state, camera motion, and scene state.", "写っている人物、現在のポーズ・体位、服装、カメラの動き、場面状態を記入します。") }>
          <textarea rows={4} value={basic.extendSourceSummary} onChange={(event) => setBasic({ extendSourceSummary: event.target.value })} placeholder={label("At the end of Video 1…", "Video 1の最後では…")}/>
        </Field>
        <Field label={label("Action already completed (do not repeat)", "完了済みの動作（繰り返し禁止）")}>
          <input value={basic.extendPreviousAction} onChange={(event) => setBasic({ extendPreviousAction: event.target.value })} placeholder={label("e.g. she has just turned toward camera", "例：カメラへ振り返る動作は完了済み")}/>
        </Field>
        <Field label={label("Prompt output language", "プロンプト出力言語")}>
          <select value={basic.extendPromptLanguage} onChange={(event) => setBasic({ extendPromptLanguage: event.target.value as typeof basic.extendPromptLanguage })}>
            <option value="english">English — {label("recommended for H3", "H3推奨")}</option>
            <option value="japanese">日本語</option>
          </select>
        </Field>
        <div className="continuity-grid">
          <label className="check-row"><input type="checkbox" checked={basic.extendUseIdentityImage} onChange={(event) => setBasic({ extendUseIdentityImage: event.target.checked })}/><span>{label("Add @Image identity lock", "@Image 人物同一性ロックを追加")}</span></label>
          <label className="check-row"><input type="checkbox" checked={basic.extendUseEnvironmentImage} onChange={(event) => setBasic({ extendUseEnvironmentImage: event.target.checked })}/><span>{label("Add @Image environment lock", "@Image 環境ロックを追加")}</span></label>
        </div>

        <div className="section-label"><ShieldCheck size={14} /> {label("Tail-to-target transition", "末尾から指定状態への移行")}</div>
        <Field label={label("Pose / position", "ポーズ・体位")}><select value={basic.extendPosePolicy} onChange={(event) => setBasic({ extendPosePolicy: event.target.value as typeof basic.extendPosePolicy })}>
          <option value="transition">{label("Source tail → timeline target naturally", "延長元の末尾 → タイムライン指定へ自然に移行")}</option>
          <option value="preserve">{label("Preserve source-tail pose / position", "延長元のポーズ・体位を維持")}</option>
        </select></Field>
        <Field label={label("Clothing state", "服装の状態")}><select value={basic.extendClothingPolicy} onChange={(event) => setBasic({ extendClothingPolicy: event.target.value as typeof basic.extendClothingPolicy })}>
          <option value="preserve">{label("Preserve source-tail wardrobe", "延長元の服装を維持")}</option>
          <option value="transition">{label("Source tail → timeline target visibly", "延長元の末尾 → 指定状態へ目に見える動きで移行")}</option>
        </select></Field>
        <Field label={label("Camera path", "カメラ軌道")}><select value={basic.extendCameraSource} onChange={(event) => setBasic({ extendCameraSource: event.target.value as typeof basic.extendCameraSource })}>
          <option value="continue">{label("Continue exact source movement", "延長元の動きを同じ速度・方向で継続")}</option>
          <option value="prompt">{label("Move smoothly toward timeline camera", "タイムラインのカメラ指定へ滑らかに移行")}</option>
        </select></Field>
        <Field label={label("Explicit ending frame", "終了フレームの指定")} hint={label("Leave blank to infer it from the final continuation beat.", "空欄の場合は最後の延長ビートから自動生成します。") }>
          <textarea rows={3} value={basic.extendEndingFrame} onChange={(event) => setBasic({ extendEndingFrame: event.target.value })} placeholder={label("End with…", "最後は…で終わる")}/>
        </Field>
        <Field label={label("Sound continuity", "音の連続性")}>
          <textarea rows={3} value={basic.extendSoundContinuity} onChange={(event) => setBasic({ extendSoundContinuity: event.target.value })}/>
        </Field>
      </>}

      {basic.mode === "T2V" && <>
        <div className="section-label"><Camera size={14} /> {t.captureSetup}</div>
        <SelectField label={t.cameraDevice} value={basic.captureDevice} options={master.captureDevices} onChange={(captureDevice) => setBasic({ captureDevice })} />
        <label className="switch-row capture-switch"><span>{label("Convert optional numeric camera hints", "数値カメラ指定を視覚表現へ変換")}</span><input type="checkbox" checked={basic.useNumericCameraHints} onChange={(event) => setBasic({ useNumericCameraHints: event.target.checked })}/></label>
        {basic.useNumericCameraHints && <>
          <SelectField label={label("Optional lens-look hint", "補助的なレンズ表現")} value={basic.focalLength} options={master.focalLengths} onChange={(focalLength) => setBasic({ focalLength })}/>
          <SelectField label={label("Optional framing-distance hint", "補助的な距離・構図表現")} value={basic.subjectDistance} options={master.subjectDistances} onChange={(subjectDistance) => setBasic({ subjectDistance })}/>
        </>}
        <label className="switch-row capture-switch"><span>{label("Recommend Reference Video for precise camera work", "正確なカメラワークにはReference Videoを推奨")}</span><input type="checkbox" checked={basic.includeReferenceVideoNote} onChange={(event) => setBasic({ includeReferenceVideoNote: event.target.checked })}/></label>
        <label className="switch-row capture-switch"><span>{t.naturalHandheld}</span><input type="checkbox" checked={basic.handheldShake} onChange={(event) => setBasic({ handheldShake: event.target.checked })}/></label>
        {basic.handheldShake && <SelectField label={t.shakeStyle} value={basic.handheldStyle} options={master.handheldStyles} onChange={(handheldStyle) => setBasic({ handheldStyle })}/>} 
        <div className="section-label"><ShieldCheck size={14} /> {label("Continuity locks", "連続性・破綻防止")}</div>
        <div className="continuity-grid">{([
          ["preserveIdentity", "Identity", "人物同一性"], ["preserveWardrobe", "Wardrobe", "衣装"], ["stabilizeAnatomy", "Anatomy / hands", "人体・手指"],
          ["stabilizeBackground", "Background", "背景"], ["preserveLighting", "Lighting", "照明"], ["preventCameraTeleport", "Camera path", "カメラ軌道"], ["continuousTake", "No unintended cuts", "意図しないカット禁止"],
        ] as const).map(([key, eng, jap]) => <label className="check-row" key={key}><input type="checkbox" checked={basic[key]} onChange={(event) => setBasic({ [key]: event.target.checked })}/><span>{label(eng, jap)}</span></label>)}</div>
      </>}

      <div className="section-label"><AudioLines size={14} /> {t.soundDesign}</div>
      <SelectField label={t.soundPreset} value={soundscape} options={master.soundPresets} onChange={setSoundscape}/>
      <Field label={t.customSoundscape}><textarea rows={3} value={soundscape} onChange={(event) => setSoundscape(event.target.value)}/></Field>
      <SelectField label={t.music} value={music} options={master.musicOptions} onChange={setMusic}/>

      <Field label={basic.mode === "EXTEND" ? label("Additional continuation direction", "追加の延長指示") : basic.mode === "I2V" ? label("Additional motion direction", "追加モーション指示") : t.globalNotes}
        hint={basic.mode === "T2V" ? t.notesHint : label("This refines motion only and cannot override the source locks.", "参照元の維持ロックより下位のモーション指示として追加します。") }>
        <textarea rows={4} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} placeholder={t.notesPlaceholder}/>
      </Field>
    </aside>
  );
}
