"use client";

import { AudioLines, Camera, MapPin, Shirt } from "lucide-react";
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

      <div className="section-label"><Camera size={14} /> {t.captureSetup}</div>
      <SelectField label={t.cameraDevice} value={basic.captureDevice} options={master.captureDevices} onChange={(captureDevice) => setBasic({ captureDevice })} />
      <SelectField label={t.focalLength} value={basic.focalLength} options={master.focalLengths} onChange={(focalLength) => setBasic({ focalLength })} />
      <SelectField label={t.subjectDistance} value={basic.subjectDistance} options={master.subjectDistances} onChange={(subjectDistance) => setBasic({ subjectDistance })} />
      <label className="switch-row capture-switch">
        <span>{t.naturalHandheld}</span>
        <input type="checkbox" checked={basic.handheldShake} onChange={(event) => setBasic({ handheldShake: event.target.checked })} />
      </label>
      {basic.handheldShake && <SelectField label={t.shakeStyle} value={basic.handheldStyle} options={master.handheldStyles} onChange={(handheldStyle) => setBasic({ handheldStyle })} />}

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
