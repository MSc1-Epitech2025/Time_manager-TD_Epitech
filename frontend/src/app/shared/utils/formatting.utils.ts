// absence types
export function formatAbsenceType(type: string): string {
  const typeMap: Record<string, string> = {
    SICK: 'Sick Leave',
    VACATION: 'Vacation',
    PERSONAL: 'Personal Leave',
    FORMATION: 'Training',
    OTHER: 'Other',
    RTT: 'RTT',
  };
  return typeMap[type] || type;
}

// time helpers
export function formatTimeHHMM(seconds: number): string {
  const minutes = Math.floor(seconds / 60) % 60;
  const hours = Math.floor(seconds / 3600);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatHoursMinutes(totalSeconds: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
  };
}

// weather icons
export function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? 'wb_sunny' : 'nights_stay';
  if (code <= 3) return isDay ? 'wb_cloudy' : 'cloud';
  if (code <= 67) return 'grain';
  if (code <= 77) return 'ac_unit';
  if (code <= 82) return 'water_drop';
  if (code <= 99) return 'thunderstorm';
  return 'wb_sunny';
}

// user display
export function formatUserName(user: { firstName?: string | null; lastName?: string | null; email?: string | null; id?: string | number | null }): string {
  const first = user.firstName?.trim() ?? '';
  const last = user.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (user.email) {
    const atIndex = user.email.indexOf('@');
    if (atIndex > 0) return user.email.substring(0, atIndex);
    return user.email;
  }
  return String(user.id ?? 'Unknown');
}

// file names
export function buildFileName(base: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Document-${base}-${date}.${ext}`;
}
