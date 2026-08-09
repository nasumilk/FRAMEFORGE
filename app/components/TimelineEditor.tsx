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
import { AlertTriangle, Plus, Sparkles } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { validateTimeline } from "../lib/promptGenerator";
import { EventCard } from "./EventCard";

export function TimelineEditor() {
  const basic = usePromptStore((state) => state.basic);
  const events = usePromptStore((state) => state.events);
  const addEvent = usePromptStore((state) => state.addEvent);
  const updateEvent = usePromptStore((state) => state.updateEvent);
  const removeEvent = usePromptStore((state) => state.removeEvent);
  const reorderEvents = usePromptStore((state) => state.reorderEvents);
  const autoFitEvents = usePromptStore((state) => state.autoFitEvents);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const issues = useMemo(() => validateTimeline(events, basic.duration), [events, basic.duration]);

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
          <div className="panel-kicker">Sequence builder</div>
          <h1>Timeline</h1>
          <p>Arrange physical beats, framing, and emotional progression.</p>
        </div>
        <div className="duration-control">
          <span>DURATION</span>
          <strong>{basic.duration}s</strong>
          <input aria-label="Duration" type="range" min={4} max={15} step={1} value={basic.duration} onChange={(event) => usePromptStore.getState().setBasic({ duration: Number(event.target.value) })} />
        </div>
      </div>

      <div className="ruler" aria-label={`${basic.duration} second timeline`}>
        <div className="ruler-track" />
        {Array.from({ length: basic.duration + 1 }, (_, second) => (
          <span key={second} style={{ left: `${(second / basic.duration) * 100}%` }}><i />{second}s</span>
        ))}
      </div>

      <div className="timeline-tools">
        <div className={`status-pill ${issues.length ? "warning" : "ok"}`}>
          {issues.length ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
          {issues.length ? `${issues.length} timing issue${issues.length > 1 ? "s" : ""}` : "Sequence aligned"}
        </div>
        {issues.length > 0 && <button className="text-button" onClick={autoFitEvents}>Auto-fit timing</button>}
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
          <strong>Create the first event</strong>
          <small>Your {basic.duration}-second sequence will be timed automatically.</small>
        </button>
      )}

      {events.length > 0 && <button className="add-event" onClick={addEvent}><Plus size={17} /> Add event</button>}
    </main>
  );
}
