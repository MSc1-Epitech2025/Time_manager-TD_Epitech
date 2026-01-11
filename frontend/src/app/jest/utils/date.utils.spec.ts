import {
  currentWeekRange,
  formatDateToYYYYMMDD,
  toDayKey,
  countWeekdays,
  parseDate,
  clampPct,
  dayRange,
  getCurrentQuarter,
  getYearRange,
  formatDate,
} from '@shared/utils/date.utils';

describe('date.utils', () => {
  describe('currentWeekRange', () => {
    it('should return Monday to next Monday for a weekday', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 17));

      const { from, to } = currentWeekRange();

      expect(from.getDay()).toBe(1);
      expect(from.getDate()).toBe(15);
      expect(from.getHours()).toBe(0);
      expect(from.getMinutes()).toBe(0);
      expect(to.getDate()).toBe(22);

      jest.useRealTimers();
    });

    it('should handle Sunday (day 0) correctly', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 21));

      const { from, to } = currentWeekRange();

      expect(from.getDay()).toBe(1);
      expect(from.getDate()).toBe(15);
      expect(to.getDate()).toBe(22);

      jest.useRealTimers();
    });

    it('should handle Monday correctly', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15));

      const { from, to } = currentWeekRange();

      expect(from.getDate()).toBe(15);
      expect(to.getDate()).toBe(22);

      jest.useRealTimers();
    });
  });

  describe('formatDateToYYYYMMDD', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDateToYYYYMMDD(date)).toBe('2024-01-15');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2024, 4, 5);
      expect(formatDateToYYYYMMDD(date)).toBe('2024-05-05');
    });

    it('should handle December correctly', () => {
      const date = new Date(2024, 11, 31);
      expect(formatDateToYYYYMMDD(date)).toBe('2024-12-31');
    });
  });

  describe('toDayKey', () => {
    it('should return day key in YYYY-MM-DD format', () => {
      const date = new Date(2024, 5, 20);
      expect(toDayKey(date)).toBe('2024-06-20');
    });

    it('should pad single digit values', () => {
      const date = new Date(2024, 0, 1);
      expect(toDayKey(date)).toBe('2024-01-01');
    });
  });

  describe('countWeekdays', () => {
    it('should count weekdays correctly excluding weekends', () => {
      const from = new Date(2024, 0, 15);
      const to = new Date(2024, 0, 22);

      expect(countWeekdays(from, to)).toBe(5);
    });

    it('should return 0 for same date', () => {
      const date = new Date(2024, 0, 15);
      expect(countWeekdays(date, date)).toBe(0);
    });

    it('should skip Saturday (day 6)', () => {
      const from = new Date(2024, 0, 19);
      const to = new Date(2024, 0, 22);

      expect(countWeekdays(from, to)).toBe(1);
    });

    it('should skip Sunday (day 0)', () => {
      const from = new Date(2024, 0, 20);
      const to = new Date(2024, 0, 22);

      expect(countWeekdays(from, to)).toBe(0);
    });

    it('should count full week correctly', () => {
      const from = new Date(2024, 0, 1);
      const to = new Date(2024, 0, 8);

      expect(countWeekdays(from, to)).toBe(5);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-01-15');

      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(15);
    });

    it('should return null for invalid year', () => {
      expect(parseDate('abcd-01-15')).toBeNull();
    });

    it('should return null for invalid month', () => {
      expect(parseDate('2024-xx-15')).toBeNull();
    });

    it('should return null for invalid day', () => {
      expect(parseDate('2024-01-yy')).toBeNull();
    });

    it('should return null for completely invalid string', () => {
      expect(parseDate('invalid')).toBeNull();
    });

    it('should set time to midnight', () => {
      const result = parseDate('2024-06-20');

      expect(result!.getHours()).toBe(0);
      expect(result!.getMinutes()).toBe(0);
      expect(result!.getSeconds()).toBe(0);
    });
  });

  describe('clampPct', () => {
    it('should return value within range', () => {
      expect(clampPct(50)).toBe(50);
    });

    it('should clamp value below 0 to 0', () => {
      expect(clampPct(-10)).toBe(0);
    });

    it('should clamp value above 100 to 100', () => {
      expect(clampPct(150)).toBe(100);
    });

    it('should return 0 for NaN', () => {
      expect(clampPct(NaN)).toBe(0);
    });

    it('should return 0 for Infinity', () => {
      expect(clampPct(Infinity)).toBe(0);
    });

    it('should return 0 for negative Infinity', () => {
      expect(clampPct(-Infinity)).toBe(0);
    });

    it('should round decimal values', () => {
      expect(clampPct(50.6)).toBe(51);
      expect(clampPct(50.4)).toBe(50);
    });

    it('should handle edge case 0', () => {
      expect(clampPct(0)).toBe(0);
    });

    it('should handle edge case 100', () => {
      expect(clampPct(100)).toBe(100);
    });
  });

  describe('dayRange', () => {
    it('should return day start and next day start', () => {
      const { from, to } = dayRange('2024-01-15');

      expect(from.getFullYear()).toBe(2024);
      expect(from.getMonth()).toBe(0);
      expect(from.getDate()).toBe(15);
      expect(from.getHours()).toBe(0);

      expect(to.getDate()).toBe(16);
    });

    it('should handle end of month', () => {
      const { from, to } = dayRange('2024-01-31');

      expect(from.getDate()).toBe(31);
      expect(to.getMonth()).toBe(1); // February
      expect(to.getDate()).toBe(1);
    });

    it('should handle end of year', () => {
      const { from, to } = dayRange('2024-12-31');

      expect(from.getMonth()).toBe(11);
      expect(to.getFullYear()).toBe(2025);
      expect(to.getMonth()).toBe(0);
      expect(to.getDate()).toBe(1);
    });
  });

  describe('getCurrentQuarter', () => {
    it('Jan → Mar returns Oct (previous year) → Mar', () => {
      const date = new Date(2024, 0, 15);
      const { start, end } = getCurrentQuarter(date);

      expect(start).toEqual(new Date(2023, 9, 1, 0, 0, 0, 0));

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(2);
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('Feb → Mar returns Oct (previous year) → Mar', () => {
      const date = new Date(2024, 1, 10);
      const { start, end } = getCurrentQuarter(date);

      expect(start.getMonth()).toBe(9);
      expect(end.getMonth()).toBe(2);
    });

    it('Apr → Jun returns Jan → Jun', () => {
      const date = new Date(2024, 3, 15);
      const { start, end } = getCurrentQuarter(date);

      expect(start).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0));
      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(5);
      expect(end.getDate()).toBe(30);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('May → Jun returns Jan → Jun', () => {
      const date = new Date(2024, 4, 5);
      const { start, end } = getCurrentQuarter(date);

      expect(start.getMonth()).toBe(0);
      expect(end.getMonth()).toBe(5);
    });

    it('Jul → Sep returns Apr → Sep', () => {
      const date = new Date(2024, 6, 15);
      const { start, end } = getCurrentQuarter(date);

      expect(start).toEqual(new Date(2024, 3, 1, 0, 0, 0, 0));

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(8);
      expect(end.getDate()).toBe(30);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('Aug → Sep returns Apr → Sep', () => {
      const date = new Date(2024, 7, 20);
      const { start, end } = getCurrentQuarter(date);

      expect(start.getMonth()).toBe(3);
      expect(end.getMonth()).toBe(8);
    });

    it('Oct → Dec returns Jul → Dec', () => {
      const date = new Date(2024, 9, 10);
      const { start, end } = getCurrentQuarter(date);

      expect(start).toEqual(new Date(2024, 6, 1, 0, 0, 0, 0));

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('Nov → Dec returns Jul → Dec', () => {
      const date = new Date(2024, 10, 25);
      const { start, end } = getCurrentQuarter(date);

      expect(start.getMonth()).toBe(6);
      expect(end.getMonth()).toBe(11);
    });

    it('uses current date if no argument provided', () => {
      const { start, end } = getCurrentQuarter();

      expect(start).toBeInstanceOf(Date);
      expect(end).toBeInstanceOf(Date);
      expect(start.getTime()).toBeLessThan(end.getTime());
    });
  });

  describe('getYearRange', () => {
    it('should return full year range', () => {
      const date = new Date(2024, 5, 15);
      const { start, end } = getYearRange(date);

      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('should use current date when no parameter provided', () => {
      const { start, end } = getYearRange();
      const currentYear = new Date().getFullYear();

      expect(start.getFullYear()).toBe(currentYear);
      expect(end.getFullYear()).toBe(currentYear);
    });
  });

  describe('formatDate', () => {
    it('should format date string to readable format', () => {
      const result = formatDate('2024-01-15');

      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle ISO date string', () => {
      const result = formatDate('2024-06-20T10:30:00Z');

      expect(result).toContain('2024');
    });

    it('should format December date correctly', () => {
      const result = formatDate('2024-12-25');

      expect(result).toContain('Dec');
      expect(result).toContain('25');
    });
  });
});
