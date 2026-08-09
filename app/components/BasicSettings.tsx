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

  return (
    <aside className="panel settings-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><UserRound size={14} /> {t.subject}</div>
        <h2>{t.characterSetup}</h2>
        <p>{t.characterDescription}</p>
      </div>

      <div className="adult-notice"><span>18+</span> {t.adultsOnly}</div>

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
      <SelectField label={t.hair} value={basic.hair} options={master.hairStyles} onChange={(hair) => setBasic({ hair })} />
      <SelectField label={t.eyes} value={basic.eyes} options={master.eyeStyles} onChange={(eyes) => setBasic({ eyes })} />
      <SelectField label={t.skin} value={basic.skin} options={master.skinOptions} onChange={(skin) => setBasic({ skin })} />

      <div className="section-rule" />
      <label className="switch-row">
        <span><UsersRound size={16} /> {t.includeMaleActor}</span>
        <input type="checkbox" checked={basic.maleActor} onChange={(event) => setBasic({ maleActor: event.target.checked })} />
      </label>

      {basic.maleActor && (
        <div className="nested-settings">
          <SelectField label={t.build} value={basic.maleBodyType} options={master.maleBodyTypes} onChange={(maleBodyType) => setBasic({ maleBodyType })} />
          <SelectField label={t.ageFeel} value={basic.maleAgeFeel} options={master.maleAgeFeels} onChange={(maleAgeFeel) => setBasic({ maleAgeFeel })} />
          <label className="check-row"><input type="checkbox" checked={basic.maleFaceVisible} onChange={(event) => setBasic({ maleFaceVisible: event.target.checked })} /> {t.faceVisible}</label>
        </div>
      )}

      <div className="section-rule" />
      <SelectField label={t.globalStyle} value={basic.style} options={master.stylePresets} onChange={(style) => setBasic({ style })} />
      <SelectField label={t.lighting} value={basic.lighting} options={master.lightingOptions} onChange={(lighting) => setBasic({ lighting })} />
    </aside>
  );
}
