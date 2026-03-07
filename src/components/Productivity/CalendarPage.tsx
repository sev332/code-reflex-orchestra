// Full calendar with day/week/month views, event CRUD, drag interactions
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Tag,
  CalendarDays, Wand2, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarView = 'month' | 'week' | 'day';

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  location?: string;
  description?: string;
  attendees?: string[];
}

const COLORS = [
  'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
  'bg-purple-500/20 border-purple-500/50 text-purple-300',
  'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
  'bg-rose-500/20 border-rose-500/50 text-rose-300',
  'bg-amber-500/20 border-amber-500/50 text-amber-300',
  'bg-blue-500/20 border-blue-500/50 text-blue-300',
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function generateId() { return Math.random().toString(36).slice(2, 10); }

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days: Date[] = [];
  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // Current month
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Demo events
const demoEvents: CalEvent[] = [
  { id: '1', title: 'Team Standup', start: new Date(2026, 2, 7, 9, 0), end: new Date(2026, 2, 7, 9, 30), color: COLORS[0], location: 'Virtual', attendees: ['Alex', 'Jordan'] },
  { id: '2', title: 'Design Review', start: new Date(2026, 2, 7, 14, 0), end: new Date(2026, 2, 7, 15, 0), color: COLORS[1], location: 'Room 3B' },
  { id: '3', title: 'Sprint Planning', start: new Date(2026, 2, 9, 10, 0), end: new Date(2026, 2, 9, 11, 30), color: COLORS[2] },
  { id: '4', title: 'AI Architecture Session', start: new Date(2026, 2, 10, 13, 0), end: new Date(2026, 2, 10, 16, 0), color: COLORS[3], description: 'Deep dive into AIMOS orchestration' },
  { id: '5', title: 'Code Review', start: new Date(2026, 2, 11, 11, 0), end: new Date(2026, 2, 11, 12, 0), color: COLORS[4] },
  { id: '6', title: 'Lunch', start: new Date(2026, 2, 7, 12, 0), end: new Date(2026, 2, 7, 13, 0), color: COLORS[5] },
];

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 7));
  const [events, setEvents] = useState<CalEvent[]>(demoEvents);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalEvent> | null>(null);
  const today = new Date(2026, 2, 7);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date(today));

  const openNewEvent = (date?: Date, hour?: number) => {
    const start = date ? new Date(date) : new Date(currentDate);
    if (hour !== undefined) start.setHours(hour, 0, 0, 0);
    else start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    setEditingEvent({ title: '', start, end, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setShowEventDialog(true);
  };

  const openEditEvent = (ev: CalEvent) => {
    setEditingEvent({ ...ev });
    setShowEventDialog(true);
  };

  const saveEvent = () => {
    if (!editingEvent?.title) return;
    if (editingEvent.id) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...editingEvent } as CalEvent : e));
    } else {
      setEvents(prev => [...prev, { ...editingEvent, id: generateId() } as CalEvent]);
    }
    setShowEventDialog(false);
    setEditingEvent(null);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowEventDialog(false);
    setEditingEvent(null);
  };

  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const weekDays = getWeekDays(currentDate);
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.getMonth() === last.getMonth()) return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
      return `${MONTHS[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${MONTHS[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 shrink-0">
        <Button variant="outline" size="sm" onClick={goToday} className="h-7 text-xs">Today</Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => navigate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-sm font-semibold flex-1">{headerTitle}</h2>

        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          {(['day', 'week', 'month'] as CalendarView[]).map(v => (
            <Button
              key={v}
              variant={view === v ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView(v)}
              className={cn('h-6 px-3 text-xs rounded-md capitalize', view === v && 'bg-primary/15 text-primary')}
            >{v}</Button>
          ))}
        </div>

        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => openNewEvent()}>
          <Plus className="w-3.5 h-3.5" /> Event
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> AI
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && <MonthView currentDate={currentDate} today={today} events={events} onClickDate={(d) => { setCurrentDate(d); setView('day'); }} onClickEvent={openEditEvent} />}
        {view === 'week' && <WeekView currentDate={currentDate} today={today} events={events} onClickHour={openNewEvent} onClickEvent={openEditEvent} />}
        {view === 'day' && <DayView currentDate={currentDate} today={today} events={events} onClickHour={(h) => openNewEvent(currentDate, h)} onClickEvent={openEditEvent} />}
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent?.id ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Event title"
              value={editingEvent?.title || ''}
              onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="bg-muted/30 border-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start</label>
                <Input
                  type="datetime-local"
                  value={editingEvent?.start ? new Date(editingEvent.start.getTime() - editingEvent.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, start: new Date(e.target.value) } : null)}
                  className="bg-muted/30 border-none text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End</label>
                <Input
                  type="datetime-local"
                  value={editingEvent?.end ? new Date(editingEvent.end.getTime() - editingEvent.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, end: new Date(e.target.value) } : null)}
                  className="bg-muted/30 border-none text-xs"
                />
              </div>
            </div>
            <Input
              placeholder="Location"
              value={editingEvent?.location || ''}
              onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
              className="bg-muted/30 border-none"
            />
            <Input
              placeholder="Description"
              value={editingEvent?.description || ''}
              onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
              className="bg-muted/30 border-none"
            />
          </div>
          <DialogFooter className="flex gap-2">
            {editingEvent?.id && (
              <Button variant="destructive" size="sm" onClick={() => deleteEvent(editingEvent.id!)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={saveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Month View ─────────────
function MonthView({ currentDate, today, events, onClickDate, onClickEvent }: { currentDate: Date; today: Date; events: CalEvent[]; onClickDate: (d: Date) => void; onClickEvent: (e: CalEvent) => void }) {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter(e => isSameDay(e.start, day));

          return (
            <div
              key={i}
              onClick={() => onClickDate(day)}
              className={cn(
                'border-b border-r border-border/20 p-1 cursor-pointer hover:bg-white/5 transition-colors min-h-0 overflow-hidden',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              <div className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5',
                isToday && 'bg-primary text-primary-foreground',
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map(ev => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
                    className={cn('w-full text-left text-[10px] px-1 py-0.5 rounded border truncate', ev.color)}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ─────────────
function WeekView({ currentDate, today, events, onClickHour, onClickEvent }: { currentDate: Date; today: Date; events: CalEvent[]; onClickHour: (d: Date, h: number) => void; onClickEvent: (e: CalEvent) => void }) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/30 shrink-0">
        <div />
        {weekDays.map((d, i) => (
          <div key={i} className="text-center py-2 border-l border-border/20">
            <p className="text-[10px] text-muted-foreground">{DAYS[d.getDay()]}</p>
            <p className={cn(
              'text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full mx-auto',
              isSameDay(d, today) && 'bg-primary text-primary-foreground'
            )}>
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div className="h-14 flex items-start justify-end pr-2 text-[10px] text-muted-foreground -mt-2">
                {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
              </div>
              {weekDays.map((d, di) => {
                const hourEvents = events.filter(e =>
                  isSameDay(e.start, d) && e.start.getHours() === h
                );
                return (
                  <div
                    key={di}
                    onClick={() => onClickHour(d, h)}
                    className="h-14 border-l border-t border-border/15 hover:bg-white/5 cursor-pointer relative transition-colors"
                  >
                    {hourEvents.map(ev => {
                      const duration = (ev.end.getTime() - ev.start.getTime()) / 3600000;
                      return (
                        <button
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
                          className={cn(
                            'absolute inset-x-1 rounded border px-1.5 py-0.5 text-[11px] font-medium truncate z-10 cursor-pointer',
                            ev.color
                          )}
                          style={{ top: 1, height: `${Math.max(duration * 56 - 2, 20)}px` }}
                        >
                          {ev.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Day View ─────────────
function DayView({ currentDate, today, events, onClickHour, onClickEvent }: { currentDate: Date; today: Date; events: CalEvent[]; onClickHour: (h: number) => void; onClickEvent: (e: CalEvent) => void }) {
  const dayEvents = events.filter(e => isSameDay(e.start, currentDate));

  return (
    <div className="h-full flex">
      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[60px_1fr]">
          {HOURS.map(h => {
            const hourEvents = dayEvents.filter(e => e.start.getHours() === h);
            return (
              <React.Fragment key={h}>
                <div className="h-16 flex items-start justify-end pr-2 text-[10px] text-muted-foreground -mt-2">
                  {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
                </div>
                <div
                  onClick={() => onClickHour(h)}
                  className="h-16 border-t border-border/15 hover:bg-white/5 cursor-pointer relative transition-colors"
                >
                  {hourEvents.map(ev => {
                    const duration = (ev.end.getTime() - ev.start.getTime()) / 3600000;
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
                        className={cn(
                          'absolute left-1 right-4 rounded border px-2 py-1 text-xs font-medium z-10 cursor-pointer',
                          ev.color
                        )}
                        style={{ top: 1, height: `${Math.max(duration * 64 - 2, 24)}px` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">{ev.title}</span>
                          {ev.location && <span className="text-[10px] opacity-70 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{ev.location}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>

      {/* Side panel: upcoming */}
      <div className="w-64 border-l border-border/30 shrink-0">
        <div className="p-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Today's Events</h3>
        </div>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="p-2 space-y-2">
            {dayEvents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No events today</p>
            )}
            {dayEvents.map(ev => (
              <button
                key={ev.id}
                onClick={() => onClickEvent(ev)}
                className={cn('w-full text-left rounded-lg border p-2.5 cursor-pointer hover:bg-white/5 transition-colors', ev.color)}
              >
                <p className="text-sm font-medium truncate">{ev.title}</p>
                <p className="text-[10px] opacity-70 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {ev.start.getHours().toString().padStart(2, '0')}:{ev.start.getMinutes().toString().padStart(2, '0')} – {ev.end.getHours().toString().padStart(2, '0')}:{ev.end.getMinutes().toString().padStart(2, '0')}
                </p>
                {ev.location && (
                  <p className="text-[10px] opacity-70 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{ev.location}
                  </p>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
