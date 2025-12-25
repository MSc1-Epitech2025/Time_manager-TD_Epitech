import { TimerService } from '@core/services/timer';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    localStorage.clear();
    service = new TimerService();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  describe('clockInAt getter', () => {
    it('returns null when localStorage has no value', () => {
      expect(service.clockInAt).toBeNull();
    });

    it('returns number when localStorage has value', () => {
      localStorage.setItem('tm.clockInAt', '12345');
      expect(service.clockInAt).toBe(12345);
    });
  });

  describe('startClock', () => {
    it('saves timestamp to localStorage and starts ticker', () => {
      jest.useFakeTimers();
      const start = 1_600_000_000_000;
      jest.setSystemTime(start);

      service.startClock(start);

      expect(localStorage.getItem('tm.clockInAt')).toBe(String(start));
      jest.advanceTimersByTime(0);
      expect((service as any)._elapsedSec$.getValue()).toBe(0);
    });

    it('uses Date.now() as default parameter', () => {
      jest.useFakeTimers();
      const now = 1_600_000_000_000;
      jest.setSystemTime(now);

      service.startClock();

      expect(localStorage.getItem('tm.clockInAt')).toBe(String(now));
    });

    it('unsubscribes previous subscription before starting new one', () => {
      const fakeSub = { unsubscribe: jest.fn() };
      (service as any).tickSub = fakeSub;

      jest.useFakeTimers();
      jest.setSystemTime(1_700_000_000_000);

      service.startClock(1_700_000_000_000);

      expect(fakeSub.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('stopClock', () => {
    it('removes localStorage key and resets elapsed to 0', () => {
      jest.useFakeTimers();
      const start = 1_600_000_000_000;
      jest.setSystemTime(start);

      service.startClock(start);
      service.stopClock();

      expect(localStorage.getItem('tm.clockInAt')).toBeNull();
      expect((service as any)._elapsedSec$.getValue()).toBe(0);
    });

    it('unsubscribes ticker subscription', () => {
      jest.useFakeTimers();
      jest.setSystemTime(1_600_000_000_000);

      service.startClock(1_600_000_000_000);
      const tickSub = (service as any).tickSub;
      const unsubSpy = jest.spyOn(tickSub, 'unsubscribe');

      service.stopClock();

      expect(unsubSpy).toHaveBeenCalled();
    });
  });

  describe('hydrate', () => {
    it('starts ticker when clockInAt exists', () => {
      jest.useFakeTimers();
      const clockIn = 1_600_000_000_000;
      localStorage.setItem('tm.clockInAt', String(clockIn));
      jest.setSystemTime(clockIn + 5000);

      service.hydrate();
      jest.advanceTimersByTime(0);

      expect((service as any)._elapsedSec$.getValue()).toBe(5);
    });

    it('does nothing when clockInAt is null', () => {
      const startTickerSpy = jest.spyOn(service as any, 'startTicker');

      service.hydrate();

      expect(startTickerSpy).not.toHaveBeenCalled();
    });
  });

  describe('startTicker (private)', () => {
    it('emits elapsed seconds via interval', () => {
      jest.useFakeTimers();
      const start = 1_600_000_000_000;
      jest.setSystemTime(start);

      service.startClock(start);

      jest.setSystemTime(start + 3000);
      jest.advanceTimersByTime(3000);

      const expected = Math.floor((Date.now() - start) / 1000);
      expect((service as any)._elapsedSec$.getValue()).toBe(expected);
    });
  });
});
