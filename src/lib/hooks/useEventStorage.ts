"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { EventDetail } from "@/lib/domain/types";
import { calculateBudgetTotals } from "@/lib/domain/budget";
import {
  loadAllEvents,
  saveAllEvents,
  getActiveEventId,
  setActiveEventId,
  getSampleInitialEvent,
} from "@/lib/domain/storage";

/**
 * Clean storage hook managing event persistence, active selection, and localStorage synchronization
 */
export function useEventStorage() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);

  // Initialize and load persisted events on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadAllEvents();
      if (loaded.length === 0) {
        const initial = getSampleInitialEvent();
        setEvents([initial]);
        setActiveIdState(initial.event.id);
        saveAllEvents([initial]);
      } else {
        setEvents(loaded);
        const savedActiveId = getActiveEventId();
        if (savedActiveId && loaded.some((e) => e.event.id === savedActiveId)) {
          setActiveIdState(savedActiveId);
        } else {
          setActiveIdState(loaded[0].event.id);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    setActiveEventId(id);
  }, []);

  const updateCurrentEvent = useCallback(
    (updater: (prev: EventDetail) => EventDetail) => {
      setEvents((prevEvents) => {
        const nextEvents = prevEvents.map((item) => {
          if (item.event.id !== activeId) return item;
          const updated = updater(item);
          updated.totals = calculateBudgetTotals(updated.budgetItems, updated.event.budgetInr);
          updated.event.updatedAt = new Date().toISOString();
          return updated;
        });
        saveAllEvents(nextEvents);
        return nextEvents;
      });
    },
    [activeId]
  );

  const saveNewEvent = useCallback((detail: EventDetail) => {
    setEvents((prev) => {
      const next = [detail, ...prev];
      saveAllEvents(next);
      return next;
    });
    setActiveId(detail.event.id);
  }, [setActiveId]);

  const currentEvent = useMemo(() => {
    return events.find((e) => e.event.id === activeId) ?? events[0] ?? null;
  }, [events, activeId]);

  return {
    events,
    activeId,
    setActiveId,
    currentEvent,
    updateCurrentEvent,
    saveNewEvent,
  };
}
