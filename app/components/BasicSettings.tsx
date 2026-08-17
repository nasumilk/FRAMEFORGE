"use client";

import { UserRound, UsersRound } from "lucide-react";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";

export function BasicSettings() {
  const basic = usePromptStore((state) => state.basic);
  const master = usePromptStore((state) => state.masterData);
  const setBasic = usePromptStore((state) => state.setBasic);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const age = basic.age;
  const femalePartnerAge = basic.femalePartnerAge;
  const isI2V = basic.mode === "I2V";
  const isExtend = basic.mode === "EXTEND";
  const isReferenceMode = isI2V || isExtend;

  return (
    <aside className="panel settings-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><UserRound size={14} /> {t.subject}</div>
        <h2>{isReferenceMode ? (language === "JAP" ? "参照人物の維持" : "Reference identity") : t.characterSetup}</h2>
        <p>{isReferenceMode ? (language === "JAP" ? `${isExtend ? "延長元の動画" : "参照画像"}から人物の外見・体格・年齢感を取得し、テキストで作り直しません。` : `Appearance, body proportions, and apparent age come only from the ${isExtend ? "source video" : "reference image"} and are not rebuilt from text.`) : t.characterDescription}</p>
      </div>

      <div className="adult-notice"><span>18+</span> {t.adultsOnly}</div>

      {isReferenceMode ? <div className="i2v-reference-notice">
        <strong>{language === "JAP" ? `${isExtend ? "延長元の末尾" : "参照画像"}が人物設定の唯一の基準です` : `The ${isExtend ? "source tail" : "first frame"} is the only identity source`}</strong>
        <span>{language === "JAP" ? "年齢・髪・目・肌・体型・胸・画風・照明のT2V設定はプロンプトへ出力されません。" : "T2V age, hair, eyes, skin, body, bust, style, and lighting settings are excluded from this prompt."}</span>
      </div> : <>
      <div className="segmented compact" aria-label={t.ageInputMode}>
        <button className={age.kind === "exact" ? "active" : ""} onClick={() => setBasic({ age: { kind: "exact", value: age.kind === "exact" ? age.value : age.min } })}>{t.exact}</button>
        <button className={age.kind === "range" ? "active" : ""} onClick={() => setBasic({ age: { kind: "range", min: age.kind === "range" ? age.min : age.value, max: age.kind === "range" ? age.max : Math.min(age.value + 4, 80) } })}>{t.range}</button>
      </div>

      {age.kind === "exact" ? (
        <Field label={t.age} hint={t.hardMinimum}>
          <input type="number" min={18} max={80} value={Math.max(18, age.value)} onChange={(event) => setBasic({ age: { kind: "exact", value: Math.max(18, Number(event.target.value)) } })} />
        </Field>
      ) : (
        <div className="field-row">
          <Field label={t.ageFrom}><input type="number" min={18} max={80} value={Math.max(18, age.min)} onChange={(event) => setBasic({ age: { ...age, min: Math.max(18, Math.min(Number(event.target.value), age.max)) } })} /></Field>
          <Field label={t.ageTo}><input type="number" min={18} max={80} value={Math.max(18, age.max)} onChange={(event) => setBasic({ age: { ...age, max: Math.max(age.min, Number(event.target.value), 18) } })} /></Field>
        </div>
      )}

      <SelectField label={t.bodyType} value={basic.bodyType} options={master.bodyTypes} onChange={(bodyType) => setBasic({ bodyType })} />
      <SelectField label={t.bustSize} value={basic.bustSize} options={master.bustSizes} onChange={(bustSize) => setBasic({ bustSize })} />
      <SelectField label={t.hair} value={basic.hair} options={master.hairStyles} onChange={(hair) => setBasic({ hair })} />
      <SelectField label={t.eyes} value={basic.eyes} options={master.eyeStyles} onChange={(eyes) => setBasic({ eyes })} />
      <SelectField label={t.skin} value={basic.skin} options={master.skinOptions} onChange={(skin) => setBasic({ skin })} />
      </>}

      <div className="section-rule" />
      <div className="field-label"><span><UsersRound size={16} /> {language === "JAP" ? "出演者構成" : "Scene cast"}</span></div>
      <div className="segmented compact" aria-label={language === "JAP" ? "出演者構成" : "Scene cast"}>
        <button className={basic.sceneType === "solo" ? "active" : ""} onClick={() => setBasic({ sceneType: "solo" })}>{language === "JAP" ? "ソロ" : "Solo"}</button>
        <button className={basic.sceneType === "male-female" ? "active" : ""} onClick={() => setBasic({ sceneType: "male-female" })}>{language === "JAP" ? "男女" : "M + W"}</button>
        <button className={basic.sceneType === "female-female" ? "active" : ""} onClick={() => setBasic({ sceneType: "female-female" })}>{language === "JAP" ? "女性同士" : "W + W"}</button>
      </div>
      {isReferenceMode && <span className="field-hint">{language === "JAP" ? `${isExtend ? "延長元の末尾" : "参照画像"}に実際に写っている成人構成と一致させてください。存在しない人物は追加しません。` : `Match the adult cast already visible in the ${isExtend ? "source tail" : "first frame"}. This mode will not add a missing person.`}</span>}

      {!isReferenceMode && basic.sceneType === "male-female" && (
        <div className="nested-settings">
          <SelectField label={t.build} value={basic.maleBodyType} options={master.maleBodyTypes} onChange={(maleBodyType) => setBasic({ maleBodyType })} />
          <SelectField label={t.ageFeel} value={basic.maleAgeFeel} options={master.maleAgeFeels} onChange={(maleAgeFeel) => setBasic({ maleAgeFeel })} />
          <label className="check-row"><input type="checkbox" checked={basic.maleFaceVisible} onChange={(event) => setBasic({ maleFaceVisible: event.target.checked })} /> {t.faceVisible}</label>
        </div>
      )}

      {!isReferenceMode && basic.sceneType === "female-female" && (
        <div className="nested-settings">
          <div className="field-label"><span>{language === "JAP" ? "2人目の女性の年齢" : "Second woman's age"}</span><small>{t.hardMinimum}</small></div>
          <div className="segmented compact" aria-label={language === "JAP" ? "2人目の女性の年齢入力モード" : "Second woman's age input mode"}>
            <button className={femalePartnerAge.kind === "exact" ? "active" : ""} onClick={() => setBasic({ femalePartnerAge: { kind: "exact", value: femalePartnerAge.kind === "exact" ? femalePartnerAge.value : femalePartnerAge.min } })}>{t.exact}</button>
            <button className={femalePartnerAge.kind === "range" ? "active" : ""} onClick={() => setBasic({ femalePartnerAge: { kind: "range", min: femalePartnerAge.kind === "range" ? femalePartnerAge.min : femalePartnerAge.value, max: femalePartnerAge.kind === "range" ? femalePartnerAge.max : Math.min(femalePartnerAge.value + 4, 80) } })}>{t.range}</button>
          </div>
          {femalePartnerAge.kind === "exact" ? (
            <Field label={language === "JAP" ? "2人目の女性の年齢" : "Second woman's age"}>
              <input type="number" min={18} max={80} value={Math.max(18, femalePartnerAge.value)} onChange={(event) => setBasic({ femalePartnerAge: { kind: "exact", value: Math.max(18, Number(event.target.value)) } })} />
            </Field>
          ) : (
            <div className="field-row">
              <Field label={t.ageFrom}><input type="number" min={18} max={80} value={Math.max(18, femalePartnerAge.min)} onChange={(event) => setBasic({ femalePartnerAge: { ...femalePartnerAge, min: Math.max(18, Math.min(Number(event.target.value), femalePartnerAge.max)) } })} /></Field>
              <Field label={t.ageTo}><input type="number" min={18} max={80} value={Math.max(18, femalePartnerAge.max)} onChange={(event) => setBasic({ femalePartnerAge: { ...femalePartnerAge, max: Math.max(femalePartnerAge.min, Number(event.target.value), 18) } })} /></Field>
            </div>
          )}
          <SelectField label={language === "JAP" ? "2人目の女性の体型" : "Second woman's body type"} value={basic.femalePartnerBodyType} options={master.bodyTypes} onChange={(femalePartnerBodyType) => setBasic({ femalePartnerBodyType })} />
          <SelectField label={language === "JAP" ? "2人目の女性の胸" : "Second woman's bust"} value={basic.femalePartnerBustSize} options={master.bustSizes} onChange={(femalePartnerBustSize) => setBasic({ femalePartnerBustSize })} />
          <SelectField label={language === "JAP" ? "2人目の女性の髪" : "Second woman's hair"} value={basic.femalePartnerHair} options={master.hairStyles} onChange={(femalePartnerHair) => setBasic({ femalePartnerHair })} />
        </div>
      )}

      {!isReferenceMode && <>
        <div className="section-rule" />
        <SelectField label={t.globalStyle} value={basic.style} options={master.stylePresets} onChange={(style) => setBasic({ style })} />
        <SelectField label={t.lighting} value={basic.lighting} options={master.lightingOptions} onChange={(lighting) => setBasic({ lighting })} />
      </>}
    </aside>
  );
}
