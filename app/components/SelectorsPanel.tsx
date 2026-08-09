"use client";

import { AudioLines, MapPin, Shirt } from "lucide-react";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { CLOTHINGS, MUSIC_OPTIONS, SITUATIONS, SOUND_PRESETS } from "../lib/constants";

export function SelectorsPanel() {
  const situation = usePromptStore((state) => state.situation);
  const clothing = usePromptStore((state) => state.clothing);
  const soundscape = usePromptStore((state) => state.soundscape);
  const music = usePromptStore((state) => state.music);
  const customNotes = usePromptStore((state) => state.customNotes);
  const setSituation = usePromptStore((state) => state.setSituation);
  const setClothing = usePromptStore((state) => state.setClothing);
  const setSoundscape = usePromptStore((state) => state.setSoundscape);
  const setMusic = usePromptStore((state) => state.setMusic);
  const setCustomNotes = usePromptStore((state) => state.setCustomNotes);

  return (
    <aside className="panel content-panel">
      <div className="panel-heading">
        <div className="panel-kicker"><MapPin size={14} /> Scene</div>
        <h2>Direction</h2>
        <p>Set the location, wardrobe, and audio bed.</p>
      </div>

      <SelectField label="Situation" value={situation} options={SITUATIONS} onChange={setSituation} />
      <Field label="Custom situation"><input value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="Describe a private adult setting" /></Field>

      <div className="section-label"><Shirt size={14} /> Wardrobe</div>
      <SelectField label="Starting clothing" value={clothing} options={CLOTHINGS} onChange={setClothing} />

      <div className="section-label"><AudioLines size={14} /> Sound design</div>
      <SelectField label="Sound preset" value={soundscape} options={SOUND_PRESETS} onChange={setSoundscape} />
      <Field label="Custom soundscape"><textarea rows={3} value={soundscape} onChange={(event) => setSoundscape(event.target.value)} /></Field>
      <SelectField label="Music" value={music} options={MUSIC_OPTIONS} onChange={setMusic} />

      <Field label="Global notes" hint="Added at the end of Shot 1.">
        <textarea rows={4} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} placeholder="Motion, continuity, lens, pacing…" />
      </Field>
    </aside>
  );
}
