export function currentWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  const day = from.getDay() === 0 ? 7 : from.getDay();
  from.setDate(from.getDate() - day + 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 7);
  return { from, to };
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function countWeekdays(from: Date, to: Date): number {
  const cursor = new Date(from);
  let count = 0;
  while (cursor < to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function parseDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if ([y, m, d].some((v) => Number.isNaN(v))) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function dayRange(dayKey: string): { from: Date; to: Date } {
  const [y, m, d] = dayKey.split('-').map((value) => Number(value));
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 1);
  return { from, to };
}

export function getCurrentQuarter(date: Date = new Date()): { start: Date; end: Date } {
  const currentMonth = date.getMonth();
  let quarterStart: Date;
  let quarterEnd: Date;

  if (currentMonth >= 0 && currentMonth <= 2) {
    quarterStart = new Date(date.getFullYear() - 1, 9, 1);
    quarterEnd = new Date(date.getFullYear(), 2, 31, 23, 59, 59);
  } else if (currentMonth >= 3 && currentMonth <= 5) {
    quarterStart = new Date(date.getFullYear(), 0, 1);
    quarterEnd = new Date(date.getFullYear(), 5, 30, 23, 59, 59);
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    quarterStart = new Date(date.getFullYear(), 3, 1);
    quarterEnd = new Date(date.getFullYear(), 8, 30, 23, 59, 59);
  } else {
    quarterStart = new Date(date.getFullYear(), 6, 1);
    quarterEnd = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
  }

  return { start: quarterStart, end: quarterEnd };
}

export function getYearRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), 0, 1),
    end: new Date(date.getFullYear(), 11, 31, 23, 59, 59)
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateGroup(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
