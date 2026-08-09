"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import type { TimelineEvent } from "../lib/types";
import { ACTIONS_PLACEHOLDER } from "./internal";
import { CAMERAS, CLOTHINGS, EXPRESSIONS, PARTNER_ACTIONS, POSITIONS, SOLO_ACTIONS } from "../lib/constants";
import { Field } from "./Field";

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
  const actions = maleActor ? PARTNER_ACTIONS : SOLO_ACTIONS;
  const invalid = event.start < 0 || event.end > duration || event.end <= event.start;

  return (
    <article ref={setNodeRef} style={style} className={`event-card ${isDragging ? "dragging" : ""} ${invalid ? "invalid" : ""}`}>
      <div className="event-head">
        <button className="drag-handle" aria-label={`Drag event ${index + 1}`} {...attributes} {...listeners}><GripVertical size={18} /></button>
        <div><span className="event-number">EVENT {String(index + 1).padStart(2, "0")}</span><strong>{event.start.toFixed(1)} — {event.end.toFixed(1)}s</strong></div>
        <button className="icon-button danger" onClick={onRemove} aria-label={`Delete event ${index + 1}`}><Trash2 size={16} /></button>
      </div>

      <div className="event-grid time-grid">
        <Field label="Start"><input type="number" min={0} max={duration} step={0.1} value={event.start} onChange={(e) => onUpdate({ start: Number(e.target.value) })} /></Field>
        <Field label="End"><input type="number" min={0} max={duration} step={0.1} value={event.end} onChange={(e) => onUpdate({ end: Number(e.target.value) })} /></Field>
        <Field label="Camera"><select value={event.camera} onChange={(e) => onUpdate({ camera: e.target.value })}>{CAMERAS.map((item) => <option key={item}>{item}</option>)}</select></Field>
      </div>

      <div className="event-grid">
        <Field label="Clothing state"><select value={event.clothingState} onChange={(e) => onUpdate({ clothingState: e.target.value })}>{CLOTHINGS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        {maleActor && <Field label="Position"><select value={event.position} onChange={(e) => onUpdate({ position: e.target.value })}>{POSITIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>}
        <Field label="Action"><select value={actions.includes(event.action) ? event.action : ACTIONS_PLACEHOLDER} onChange={(e) => onUpdate({ action: e.target.value })}>{!actions.includes(event.action) && <option value={ACTIONS_PLACEHOLDER}>{event.action}</option>}{actions.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Expression"><select value={event.expression} onChange={(e) => onUpdate({ expression: e.target.value })}>{EXPRESSIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
      </div>

      <Field label="Additional direction"><input value={event.additionalDetails} onChange={(e) => onUpdate({ additionalDetails: e.target.value })} placeholder="Body movement, continuity, lens behavior…" /></Field>
    </article>
  );
}
