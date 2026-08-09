"use client";

import { UserRound, UsersRound } from "lucide-react";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import {
  BODY_TYPES,
  EYE_STYLES,
  HAIR_STYLES,
  LIGHTING_OPTIONS,
  MALE_AGE_FEELS,
  MALE_BODY_TYPES,
  SKIN_OPTIONS,
  STYLE_PRESETS,
} from "../lib/constants";

export function BasicSettings() {
  const basic = usePromptStore((state) => state.basic);
  const setBasic = usePromptStore((state) => state.setBasic);
  const age = basic.age;

  return (
    <aside className="panel settings-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><UserRound size={14} /> Subject</div>
        <h2>Character setup</h2>
        <p>Adult identity and visual continuity.</p>
      </div>

      <div className="adult-notice"><span>18+</span> Adults only. All performers must be consenting adults.</div>

      <div className="segmented compact" aria-label="Age input mode">
        <button className={age.kind === "exact" ? "active" : ""} onClick={() => setBasic({ age: { kind: "exact", value: age.kind === "exact" ? age.value : age.min } })}>Exact</button>
        <button className={age.kind === "range" ? "active" : ""} onClick={() => setBasic({ age: { kind: "range", min: age.kind === "range" ? age.min : age.value, max: age.kind === "range" ? age.max : Math.min(age.value + 4, 80) } })}>Range</button>
      </div>

      {age.kind === "exact" ? (
        <Field label="Age" hint="Hard minimum: 18">
          <input type="number" min={18} max={80} value={age.value} onChange={(event) => setBasic({ age: { kind: "exact", value: Math.max(18, Number(event.target.value)) } })} />
        </Field>
      ) : (
        <div className="field-row">
          <Field label="Age from"><input type="number" min={18} max={80} value={age.min} onChange={(event) => setBasic({ age: { ...age, min: Math.max(18, Math.min(Number(event.target.value), age.max)) } })} /></Field>
          <Field label="Age to"><input type="number" min={18} max={80} value={age.max} onChange={(event) => setBasic({ age: { ...age, max: Math.max(age.min, Number(event.target.value)) } })} /></Field>
        </div>
      )}

      <SelectField label="Body type" value={basic.bodyType} options={BODY_TYPES} onChange={(bodyType) => setBasic({ bodyType })} />
      <SelectField label="Hair" value={basic.hair} options={HAIR_STYLES} onChange={(hair) => setBasic({ hair })} />
      <SelectField label="Eyes" value={basic.eyes} options={EYE_STYLES} onChange={(eyes) => setBasic({ eyes })} />
      <SelectField label="Skin" value={basic.skin} options={SKIN_OPTIONS} onChange={(skin) => setBasic({ skin })} />

      <div className="section-rule" />
      <label className="switch-row">
        <span><UsersRound size={16} /> Include male actor</span>
        <input type="checkbox" checked={basic.maleActor} onChange={(event) => setBasic({ maleActor: event.target.checked })} />
      </label>

      {basic.maleActor && (
        <div className="nested-settings">
          <SelectField label="Build" value={basic.maleBodyType} options={MALE_BODY_TYPES} onChange={(maleBodyType) => setBasic({ maleBodyType })} />
          <SelectField label="Age feel" value={basic.maleAgeFeel} options={MALE_AGE_FEELS} onChange={(maleAgeFeel) => setBasic({ maleAgeFeel })} />
          <label className="check-row"><input type="checkbox" checked={basic.maleFaceVisible} onChange={(event) => setBasic({ maleFaceVisible: event.target.checked })} /> Face visible</label>
        </div>
      )}

      <div className="section-rule" />
      <SelectField label="Global style" value={basic.style} options={STYLE_PRESETS} onChange={(style) => setBasic({ style })} />
      <SelectField label="Lighting" value={basic.lighting} options={LIGHTING_OPTIONS} onChange={(lighting) => setBasic({ lighting })} />
    </aside>
  );
}
