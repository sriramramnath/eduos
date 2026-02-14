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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const getEventTone = (type?: string) => {
  if (type === "assignment") {
    return {
      dot: "bg-rose-500",
      chip: "bg-rose-50 border border-rose-100 text-rose-700",
      label: "Assignment",
    };
  }
  if (type === "quiz") {
    return {
      dot: "bg-violet-500",
      chip: "bg-violet-50 border border-violet-100 text-violet-700",
      label: "Quiz",
    };
  }
  if (type === "form") {
    return {
      dot: "bg-amber-500",
      chip: "bg-amber-50 border border-amber-100 text-amber-700",
      label: "Form",
    };
  }

  return {
    dot: "bg-sky-500",
    chip: "bg-sky-50 border border-sky-100 text-sky-700",
    label: "Event",
  };
};

export function CalendarView({ classId, user }: CalendarViewProps) {
  const featureApi = (api as any).featureFunctions;
  const calendarData = useQuery(featureApi.getClassCalendar, { classId }) as CalendarEvent[] | undefined;
  const createCalendarEvent = useMutation(featureApi.createCalendarEvent);
  const events = calendarData ?? [];

  const now = new Date();
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

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.startAt >= Date.now() - 24 * 60 * 60 * 1000)
      .sort((a, b) => a.startAt - b.startAt)
      .slice(0, 8);
  }, [events]);

  const goToday = () => {
    const today = new Date();
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayKey(toDayKey(today));
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Calendar</h2>
          <p className="text-sm text-slate-500 font-medium">
            Month view inspired by Google Calendar for class planning and deadlines.
          </p>
        </div>
        <button
          onClick={goToday}
          className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <CalendarDays className="w-4 h-4" /> Today
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
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
                className="w-full h-10 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>
          )}

          <div className="premium-card p-4 space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Upcoming</p>
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
                      <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
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
                onClick={() => {
                  const prev = new Date(monthCursor);
                  prev.setMonth(prev.getMonth() - 1);
                  setMonthCursor(new Date(prev.getFullYear(), prev.getMonth(), 1));
                }}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const next = new Date(monthCursor);
                  next.setMonth(next.getMonth() + 1);
                  setMonthCursor(new Date(next.getFullYear(), next.getMonth(), 1));
                }}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{monthLabel}</h3>
            <button
              onClick={goToday}
              className="md:hidden px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
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
                  className={`min-h-[110px] border-r border-b border-slate-200 p-2 md:p-2.5 text-left align-top transition-colors last:border-r-0 ${isSelected ? "bg-sky-50/60" : "bg-white hover:bg-slate-50/70"}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-semibold ${isToday ? "bg-sky-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"}`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const tone = getEventTone(event.type);
                      return (
                        <div key={event.id} className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${tone.chip}`}>
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <p className="text-[11px] font-medium text-slate-500 px-1">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="premium-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Agenda for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No events scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((event) => {
              const tone = getEventTone(event.type);
              return (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md ${tone.chip}`}>
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
