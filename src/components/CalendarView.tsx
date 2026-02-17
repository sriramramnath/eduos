import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";

interface CalendarViewProps {
  classId: Id<"classes">;
  user: any;
}

type CalendarEvent = {
  id: string;
  type?: string;
  title: string;
  description?: string;
  startAt: number;
  endAt?: number;
};

type CalendarMode = "board" | "month" | "timebox";

type TimeboxEvent = CalendarEvent & {
  top: number;
  height: number;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BOARD_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMELINE_START_HOUR = 7;
const TIMELINE_END_HOUR = 20;
const PIXELS_PER_HOUR = 64;

const toDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDayKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeekMonday = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getDefaultDurationMinutes = (type?: string) => {
  if (type === "assignment") return 60;
  if (type === "quiz") return 45;
  if (type === "form") return 30;
  return 45;
};

const getEventTone = (type?: string) => {
  if (type === "assignment") {
    return {
      dot: "bg-emerald-500",
      chip: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      label: "Assignment",
      block: "bg-emerald-600 text-white border-emerald-500",
    };
  }
  if (type === "quiz") {
    return {
      dot: "bg-emerald-500",
      chip: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      label: "Quiz",
      block: "bg-emerald-600 text-white border-emerald-500",
    };
  }
  if (type === "form") {
    return {
      dot: "bg-emerald-500",
      chip: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      label: "Form",
      block: "bg-emerald-600 text-white border-emerald-500",
    };
  }
  return {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 border border-emerald-100 text-emerald-700",
    label: "Event",
    block: "bg-emerald-600 text-white border-emerald-500",
  };
};

export function CalendarView({ classId, user }: CalendarViewProps) {
  const featureApi = (api as any).featureFunctions;
  const calendarData = useQuery(featureApi.getClassCalendar, { classId }) as CalendarEvent[] | undefined;
  const createCalendarEvent = useMutation(featureApi.createCalendarEvent);
  const events = calendarData ?? [];

  const now = new Date();
  const [viewMode, setViewMode] = useState<CalendarMode>("board");
  const [monthCursor, setMonthCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDayKey, setSelectedDayKey] = useState(() => toDayKey(now));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");

  const monthLabel = useMemo(
    () => monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [monthCursor]
  );

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = toDayKey(new Date(event.startAt));
      const bucket = grouped.get(key) || [];
      bucket.push(event);
      bucket.sort((a, b) => a.startAt - b.startAt);
      grouped.set(key, bucket);
    });
    return grouped;
  }, [events]);

  const monthGridDays = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [monthCursor]);

  const selectedDate = useMemo(() => fromDayKey(selectedDayKey), [selectedDayKey]);
  const selectedDayEvents = eventsByDay.get(selectedDayKey) || [];

  const boardWeekDays = useMemo(() => {
    const monday = startOfWeekMonday(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [selectedDate]);

  const boardRangeLabel = useMemo(() => {
    const weekStart = boardWeekDays[0];
    const weekEnd = boardWeekDays[6];
    const startLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = weekEnd.toLocaleDateString("en-US", {
      month: weekEnd.getMonth() === weekStart.getMonth() ? undefined : "short",
      day: "numeric",
      year: weekEnd.getFullYear() === weekStart.getFullYear() ? undefined : "numeric",
    });
    const yearLabel = weekEnd.getFullYear();
    return `${startLabel} - ${endLabel}, ${yearLabel}`;
  }, [boardWeekDays]);

  const timeboxLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [selectedDate]
  );

  const monthEventCount = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = new Date(event.startAt);
        return (
          eventDate.getFullYear() === monthCursor.getFullYear() &&
          eventDate.getMonth() === monthCursor.getMonth()
        );
      }).length,
    [events, monthCursor]
  );

  const weekAheadCount = useMemo(() => {
    const nowMs = Date.now();
    const sevenDays = nowMs + 7 * 24 * 60 * 60 * 1000;
    return events.filter((event) => event.startAt >= nowMs && event.startAt <= sevenDays).length;
  }, [events]);

  const assignmentCount = useMemo(
    () => events.filter((event) => event.type === "assignment").length,
    [events]
  );

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.startAt >= Date.now() - 24 * 60 * 60 * 1000)
      .sort((a, b) => a.startAt - b.startAt)
      .slice(0, 8);
  }, [events]);

  const timelineHours = useMemo(
    () => Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => TIMELINE_START_HOUR + i),
    []
  );

  const timeboxEvents = useMemo(() => {
    const timelineStartMinutes = TIMELINE_START_HOUR * 60;
    const timelineEndMinutes = TIMELINE_END_HOUR * 60;
    const pixelsPerMinute = PIXELS_PER_HOUR / 60;

    return selectedDayEvents
      .map((event) => {
        const start = new Date(event.startAt);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const inferredDuration = event.endAt
          ? Math.max(15, Math.round((event.endAt - event.startAt) / 60000))
          : getDefaultDurationMinutes(event.type);
        const endMinutes = startMinutes + inferredDuration;
        const clampedStart = Math.max(startMinutes, timelineStartMinutes);
        const clampedEnd = Math.min(endMinutes, timelineEndMinutes);

        if (clampedEnd <= timelineStartMinutes || clampedStart >= timelineEndMinutes) {
          return null;
        }

        return {
          ...event,
          top: (clampedStart - timelineStartMinutes) * pixelsPerMinute,
          height: Math.max((clampedEnd - clampedStart) * pixelsPerMinute, 30),
        };
      })
      .filter((event): event is TimeboxEvent => !!event)
      .sort((a, b) => a.startAt - b.startAt);
  }, [selectedDayEvents]);

  const currentPrimaryLabel =
    viewMode === "month" ? monthLabel : viewMode === "board" ? boardRangeLabel : timeboxLabel;

  const goToday = () => {
    const today = new Date();
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayKey(toDayKey(today));
  };

  const shiftPeriod = (direction: -1 | 1) => {
    if (viewMode === "month") {
      const next = new Date(monthCursor);
      next.setMonth(next.getMonth() + direction);
      setMonthCursor(new Date(next.getFullYear(), next.getMonth(), 1));
      return;
    }

    const step = viewMode === "board" ? 7 : 1;
    const nextDate = addDays(selectedDate, direction * step);
    setSelectedDayKey(toDayKey(nextDate));
    setMonthCursor(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };

  const createEvent = async () => {
    if (!title.trim() || !startAt) return;

    await createCalendarEvent({
      classId,
      title: title.trim(),
      description: description.trim() || undefined,
      startAt: new Date(startAt).getTime(),
      eventType: "custom",
    });

    const createdDate = new Date(startAt);
    setMonthCursor(new Date(createdDate.getFullYear(), createdDate.getMonth(), 1));
    setSelectedDayKey(toDayKey(createdDate));
    setTitle("");
    setDescription("");
    setStartAt("");
  };

  const todayKey = toDayKey(new Date());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="premium-card overflow-hidden">
        <div className="px-4 md:px-6 py-5 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Calendar</h2>
              <p className="text-sm text-slate-500 font-medium">
                Plan deadlines, lessons, and milestones in one class timeline.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("board")}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    viewMode === "board" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Week Board
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    viewMode === "month" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("timebox")}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    viewMode === "timebox" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Timebox
                </button>
              </div>
              <button
                onClick={goToday}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <CalendarDays className="w-4 h-4" /> Jump to Today
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">This Month</p>
              <p className="text-xl font-black text-slate-900">{monthEventCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Due in 7 Days</p>
              <p className="text-xl font-black text-emerald-700">{weekAheadCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Assignments</p>
              <p className="text-xl font-black text-emerald-700">{assignmentCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Selected Day</p>
              <p className="text-xl font-black text-slate-900">{selectedDayEvents.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="space-y-4">
          {user.role === "teacher" && (
            <div className="premium-card p-4 space-y-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Create Event</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Event title"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
              />
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                className="w-full h-20 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 resize-none"
              />
              <button
                onClick={() => {
                  void createEvent();
                }}
                className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>
          )}

          <div className="premium-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Upcoming</p>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{upcomingEvents.length}</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming events.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const tone = getEventTone(event.type);
                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        const eventDate = new Date(event.startAt);
                        setMonthCursor(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
                        setSelectedDayKey(toDayKey(eventDate));
                      }}
                      className="w-full text-left rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                        <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${tone.dot}`} />
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md ${tone.chip}`}>
                          {tone.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {new Date(event.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="premium-card overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftPeriod(-1)}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => shiftPeriod(1)}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center">{currentPrimaryLabel}</h3>
            <button
              onClick={goToday}
              className="md:hidden px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          {viewMode === "month" && (
            <>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="h-10 border-r border-slate-200 last:border-r-0 px-2 flex items-center justify-end">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthGridDays.map((day, index) => {
                  const key = toDayKey(day);
                  const dayEvents = eventsByDay.get(key) || [];
                  const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDayKey;

                  return (
                    <button
                      key={`${key}-${index}`}
                      onClick={() => setSelectedDayKey(key)}
                      className={`min-h-[124px] border-r border-b border-slate-200 p-2.5 text-left align-top transition-colors last:border-r-0 ${
                        isSelected ? "bg-emerald-50" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1.5">
                        <span
                          className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-semibold ${
                            isToday ? "bg-emerald-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const tone = getEventTone(event.type);
                          return (
                            <div key={event.id} className={`rounded-md px-1.5 py-1 text-[10px] font-medium ${tone.chip}`}>
                              <p className="truncate">{event.title}</p>
                              <p className="text-[9px] opacity-70 mt-0.5">
                                {new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] font-medium text-slate-500 px-1">+{dayEvents.length - 3} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "board" && (
            <div className="overflow-x-auto bg-slate-50">
              <div className="grid grid-cols-7 min-w-[980px]">
                {boardWeekDays.map((day, index) => {
                  const key = toDayKey(day);
                  const dayEvents = eventsByDay.get(key) || [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDayKey;

                  return (
                    <div key={key} className="border-r border-slate-200 last:border-r-0">
                      <button
                        onClick={() => setSelectedDayKey(key)}
                        className={`w-full text-left px-3 py-3 border-b border-slate-200 ${isSelected ? "bg-emerald-50" : "bg-white hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold ${isToday ? "text-emerald-700" : "text-slate-800"}`}>
                            {BOARD_WEEKDAY_LABELS[index]}
                          </p>
                          <span
                            className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold ${
                              isToday ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      </button>

                      <div className="p-2.5 space-y-2 min-h-[480px] bg-slate-50">
                        {dayEvents.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-center">
                            <p className="text-[11px] text-slate-400 font-medium">No items</p>
                          </div>
                        )}

                        {dayEvents.map((event) => {
                          const tone = getEventTone(event.type);
                          return (
                            <button
                              key={event.id}
                              onClick={() => setSelectedDayKey(key)}
                              className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
                              </div>
                              <div className="mt-1.5 flex items-center justify-between gap-2">
                                <span className={`text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md ${tone.chip}`}>
                                  {tone.label}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500">
                                  {new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "timebox" && (
            <div className="grid grid-cols-[56px_minmax(0,1fr)] bg-white">
              <div className="border-r border-slate-200">
                {timelineHours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                    className="border-b border-slate-100 px-1.5 pt-1 text-[10px] text-slate-400 text-right"
                  >
                    {new Date(2026, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" })}
                  </div>
                ))}
              </div>

              <div className="relative">
                {timelineHours.map((hour) => (
                  <div
                    key={`line-${hour}`}
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                    className="border-b border-slate-100"
                  />
                ))}

                <div className="absolute inset-0 pointer-events-none">
                  {timeboxEvents.map((event) => {
                    const tone = getEventTone(event.type);
                    const startTime = new Date(event.startAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    const endTime = new Date(
                      event.endAt || event.startAt + getDefaultDurationMinutes(event.type) * 60 * 1000
                    ).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={event.id}
                        style={{
                          top: `${event.top}px`,
                          height: `${event.height}px`,
                          left: "8px",
                          right: "8px",
                        }}
                        className={`absolute rounded-lg border px-3 py-2 shadow-sm ${tone.block}`}
                      >
                        <p className="text-sm font-bold truncate">{event.title}</p>
                        <p className="text-[11px] opacity-90 mt-0.5">{startTime} - {endTime}</p>
                      </div>
                    );
                  })}

                  {timeboxEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-slate-400">No events scheduled in this time range.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="premium-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-slate-900">
            Agenda for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No events scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((event) => {
              const tone = getEventTone(event.type);
              return (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3 flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                      <span
                        className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md ${tone.chip}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{event.description || "No description"}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
