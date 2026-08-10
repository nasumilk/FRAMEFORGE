"use client";

import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AlertTriangle, Clapperboard, Plus, Sparkles } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { supportedDurations, validateTimeline } from "../lib/promptGenerator";
import { EventCard } from "./EventCard";
import { UI_COPY } from "../lib/localization";

export function TimelineEditor() {
  const basic = usePromptStore((state) => state.basic);
  const events = usePromptStore((state) => state.events);
  const addEvent = usePromptStore((state) => state.addEvent);
  const addShot = usePromptStore((state) => state.addShot);
  const updateEvent = usePromptStore((state) => state.updateEvent);
  const removeEvent = usePromptStore((state) => state.removeEvent);
  const reorderEvents = usePromptStore((state) => state.reorderEvents);
  const autoFitEvents = usePromptStore((state) => state.autoFitEvents);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const issues = useMemo(() => validateTimeline(events, basic.duration), [events, basic.duration]);
  const durationOptions = supportedDurations(basic);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = events.findIndex((event) => event.id === active.id);
    const newIndex = events.findIndex((event) => event.id === over.id);
    reorderEvents(oldIndex, newIndex);
  };

  return (
    <main className="timeline-area">
      <div className="timeline-header">
        <div>
          <div className="panel-kicker">{t.sequenceBuilder}</div>
          <h1>{t.timeline}</h1>
          <p>{t.timelineDescription}</p>
        </div>
        <div className="duration-control">
          <span>{t.duration}</span>
          <strong>{basic.duration}s</strong>
          <select aria-label={t.durationControl} value={basic.duration} onChange={(event) => usePromptStore.getState().setBasic({ duration: Number(event.target.value) })}>
            {durationOptions.map((duration) => <option key={duration} value={duration}>{duration} seconds</option>)}
          </select>
        </div>
      </div>

      <div className="ruler" aria-label={`${basic.duration} ${t.secondTimeline}`}>
        <div className="ruler-track" />
        {Array.from({ length: basic.duration + 1 }, (_, second) => (
          <span key={second} style={{ left: `${(second / basic.duration) * 100}%` }}><i />{second}s</span>
        ))}
      </div>

      <div className="timeline-tools">
        <div className={`status-pill ${issues.length ? "warning" : "ok"}`}>
          {issues.length ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
          {issues.length ? `${issues.length} ${issues.length > 1 ? t.timingIssues : t.timingIssue}` : t.sequenceAligned}
        </div>
        {issues.length > 0 && <button className="text-button" onClick={autoFitEvents}>{t.autoFit}</button>}
      </div>
      {issues.length > 0 && <div className="issue-list">{issues.slice(0, 3).map((issue, index) => <span key={`${issue.message}-${index}`}>{issue.message}</span>)}</div>}

      {events.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={events.map((event) => event.id)} strategy={verticalListSortingStrategy}>
            <div className="event-list">
              {events.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} duration={basic.duration} maleActor={basic.maleActor} onUpdate={(data) => updateEvent(event.id, data)} onRemove={() => removeEvent(event.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <button className="empty-timeline" onClick={addEvent}>
          <span><Plus size={22} /></span>
          <strong>{t.createFirstEvent}</strong>
          <small>{t.autoTimed.replace("{duration}", String(basic.duration))}</small>
        </button>
      )}

      {events.length > 0 && <div className="timeline-add-actions">
        <button className="add-event" onClick={addEvent}><Plus size={17} /> {t.addEvent}</button>
        <button className="add-event add-shot" onClick={addShot}><Clapperboard size={17} /> {language === "JAP" ? "新しいショット" : "Add shot"}</button>
      </div>}
    </main>
  );
}
