import { ClockRecord } from '@shared/models/graphql.types';
import { PlanningEvent } from '@core/services/planning';
import { toDayKey, countWeekdays, clampPct, dayRange } from '@shared/utils/date.utils';

export interface ClockSession {
  start: Date;
  end: Date;
}

export interface SessionAnalysis {
  sessions: ClockSession[];
  openSession: { start: Date } | null;
  firstInPerDay: Map<string, Date>;
}

// Session building
export function buildSessions(clocks: ClockRecord[]): SessionAnalysis {
  const sorted = [...clocks].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const sessions: ClockSession[] = [];
  const firstInPerDay = new Map<string, Date>();
  let currentStart: Date | null = null;

  for (const clock of sorted) {
    const at = new Date(clock.at);
    const dayKey = toDayKey(at);

    if (clock.kind === 'IN') {
      currentStart = at;
      if (!firstInPerDay.has(dayKey) || at < firstInPerDay.get(dayKey)!) {
        firstInPerDay.set(dayKey, at);
      }
    } else if (clock.kind === 'OUT' && currentStart) {
      sessions.push({ start: currentStart, end: at });
      currentStart = null;
    }
  }

  const openSession = currentStart ? { start: currentStart } : null;
  return { sessions, openSession, firstInPerDay };
}

// Time overlap calculations
export function overlapSeconds(
  start: Date,
  end: Date,
  range: { from: Date; to: Date }
): number {
  const rangeStart = range.from.getTime();
  const rangeEnd = range.to.getTime();
  const s = Math.max(start.getTime(), rangeStart);
  const e = Math.min(end.getTime(), rangeEnd);
  return e > s ? Math.floor((e - s) / 1000) : 0;
}

// Late days counting
export function countLateDays(firstInPerDay: Map<string, Date>): number {
  const thresholdMinutes = 9 * 60 + 5;
  let late = 0;

  for (const value of firstInPerDay.values()) {
    const minutes = value.getHours() * 60 + value.getMinutes();
    if (minutes > thresholdMinutes) late += 1;
  }

  return late;
}

// Absence hours calculation
export function computeAbsenceHours(
  events: PlanningEvent[],
  range: { from: Date; to: Date }
): number {
  const rangeStart = range.from.getTime();
  const rangeEnd = range.to.getTime();
  let units = 0;

  for (const event of events) {
    const date = parseEventDate(event.date);
    if (!date) continue;

    const time = date.getTime();
    if (time < rangeStart || time >= rangeEnd) continue;
    if (event.status && event.status !== 'APPROVED') continue;

    if (event.period === 'AM' || event.period === 'PM') {
      units += 0.5;
    } else {
      units += 1;
    }
  }

  return units * 8;
}

// Metrics calculation
export interface TimeMetrics {
  baseTodaySeconds: number;
  totalWorkedSeconds: number;
  lateDays: number;
  absenceHours: number;
  presencePct: number;
  absencePct: number;
  latenessPct: number;
}

export function computeTimeMetrics(
  sessions: ClockSession[],
  absenceEvents: PlanningEvent[],
  weekRange: { from: Date; to: Date },
  todayKey: string
): TimeMetrics {
  const baseTodaySeconds = sessions.reduce((acc, session) => {
    return acc + overlapSeconds(session.start, session.end, dayRange(todayKey));
  }, 0);

  const totalWorkedSeconds = sessions.reduce((acc, session) => {
    return acc + overlapSeconds(session.start, session.end, weekRange);
  }, 0);

  const { sessions: _, openSession: __, firstInPerDay } = buildSessions(
    sessions.map(s => ({
      id: '',
      kind: 'IN' as const,
      at: s.start.toISOString()
    }))
  );

  const lateDays = countLateDays(firstInPerDay);
  const absenceHours = computeAbsenceHours(absenceEvents, weekRange);
  const totalWeekDays = countWeekdays(weekRange.from, weekRange.to);
  const expectedHours = totalWeekDays * 8;

  const presencePct = expectedHours
    ? clampPct((totalWorkedSeconds / 3600 / expectedHours) * 100)
    : 0;
  const absencePct = expectedHours
    ? clampPct((absenceHours / expectedHours) * 100)
    : 0;
  const latenessPct = totalWeekDays
    ? clampPct((lateDays / totalWeekDays) * 100)
    : 0;

  return {
    baseTodaySeconds,
    totalWorkedSeconds,
    lateDays,
    absenceHours,
    presencePct,
    absencePct,
    latenessPct
  };
}

// Chart data normalization
export function normalizeChartData(
  presencePct: number,
  absencePct: number,
  latenessPct: number
): [number, number, number] {
  const sum = presencePct + absencePct + latenessPct;
  const scale = sum > 100 && sum > 0 ? 100 / sum : 1;

  const adjPresence = Math.round(presencePct * scale);
  const adjAbsence = Math.round(absencePct * scale);
  const adjLate = Math.max(0, 100 - adjPresence - adjAbsence);

  return [adjPresence, adjLate, adjAbsence];
}

function parseEventDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if ([y, m, d].some((v) => Number.isNaN(v))) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
