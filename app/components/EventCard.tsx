"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import type { MasterItem, TimelineEvent } from "../lib/types";
import { Field, SelectField } from "./Field";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";
import { MALE_POV_CAMERA } from "../lib/constants";

const INTIMACY_OPTIONS: MasterItem[] = [
  { value: "standard intimate contact", japanese: "通常の親密な接触" },
  { value: "consensual anal intercourse", japanese: "合意した成人同士のアナル性交" },
];

export function EventCard({
  event,
  index,
  duration,
  maleActor,
  onUpdate,
  onRemove,
}: {
  event: TimelineEvent;
  index: number;
  duration: number;
  maleActor: boolean;
  onUpdate: (data: Partial<TimelineEvent>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const master = usePromptStore((state) => state.masterData);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const actions = maleActor ? master.partnerActions : master.soloActions;
  const cameraOptions = maleActor ? master.cameras : master.cameras.filter((camera) => camera.value !== MALE_POV_CAMERA);
  const invalid = event.start < 0 || event.end > duration || event.end <= event.start;

  return (
    <article ref={setNodeRef} style={style} className={`event-card ${isDragging ? "dragging" : ""} ${invalid ? "invalid" : ""}`}>
      <div className="event-head">
        <button className="drag-handle" aria-label={`${t.dragEvent} ${index + 1}`} {...attributes} {...listeners}><GripVertical size={18} /></button>
        <div><span className="event-number">{t.event} {String(index + 1).padStart(2, "0")}</span><strong>{event.start.toFixed(1)} — {event.end.toFixed(1)}s</strong></div>
        <button className="icon-button danger" onClick={onRemove} aria-label={`${t.deleteEvent} ${index + 1}`}><Trash2 size={16} /></button>
      </div>

      <div className="event-grid time-grid">
        <Field label={t.start}><input type="number" min={0} max={duration} step={0.1} value={event.start} onChange={(e) => onUpdate({ start: Number(e.target.value) })} /></Field>
        <Field label={t.end}><input type="number" min={0} max={duration} step={0.1} value={event.end} onChange={(e) => onUpdate({ end: Number(e.target.value) })} /></Field>
        <SelectField label={t.camera} value={event.camera} options={cameraOptions} onChange={(camera) => onUpdate({ camera })} />
      </div>

      <div className="event-grid">
        <SelectField label={t.pose} value={event.pose} options={master.poses} onChange={(pose) => onUpdate({ pose })} />
        <SelectField label={t.clothingState} value={event.clothingState} options={master.clothings} onChange={(clothingState) => onUpdate({ clothingState })} />
        {maleActor && <SelectField label={t.position} value={event.position} options={master.positions} onChange={(position) => onUpdate({ position })} />}
        {maleActor && <SelectField label={language === "JAP" ? "接触モード" : "Intimacy mode"} value={event.intimacyMode} options={INTIMACY_OPTIONS} onChange={(intimacyMode) => onUpdate({ intimacyMode: intimacyMode as TimelineEvent["intimacyMode"] })} />}
        <SelectField label={t.action} value={event.action} options={actions} onChange={(action) => onUpdate({ action })} />
        <SelectField label={t.expression} value={event.expression} options={master.expressions} onChange={(expression) => onUpdate({ expression })} />
      </div>

      <Field label={t.additionalDirection}><input value={event.additionalDetails} onChange={(e) => onUpdate({ additionalDetails: e.target.value })} placeholder={t.directionPlaceholder} /></Field>
    </article>
  );
}
