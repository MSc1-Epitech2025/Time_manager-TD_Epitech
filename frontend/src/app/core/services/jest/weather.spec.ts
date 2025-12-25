import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WeatherService, WeatherSnapshot } from '@core/services/weather';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpGet: jest.Mock;
  const originalGeolocation = (navigator as any).geolocation;

  beforeEach(() => {
    httpGet = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        { provide: HttpClient, useValue: { get: httpGet } },
      ],
    });
    service = TestBed.inject(WeatherService);
  });

  afterEach(() => {
    (navigator as any).geolocation = originalGeolocation;
    if ((Date.now as any)?.mockRestore) {
      (Date.now as jest.Mock).mockRestore();
    }
  });

  it('should poll and update state when geolocation succeeds', fakeAsync(() => {
    const fixedNow = 1620000000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    (navigator as any).geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 10, longitude: 20 },
        } as any);
      },
    };

    const response = {
      current: { temperature_2m: 12.34, weather_code: 5, is_day: 1 },
    };
    httpGet.mockReturnValue(of(response));

    const values: Array<WeatherSnapshot | null> = [];
    service.weather$().subscribe((v) => values.push(v));

    service.startPolling();
    tick(0);

    expect(httpGet).toHaveBeenCalled();
    const last = values[values.length - 1] as WeatherSnapshot;
    expect(last.tempC).toBe(12.34);
    expect(last.code).toBe(5);
    expect(last.isDay).toBe(true);
    expect(last.asOf).toBe(fixedNow);
  }));

  it('should use default coords when geolocation errors', fakeAsync(() => {
    (navigator as any).geolocation = {
      getCurrentPosition: (_s: any, error: PositionErrorCallback) => {
        error && error({ code: 1, message: 'fail' } as any);
      },
    };

    httpGet.mockReturnValue(of({ current: { temperature_2m: 1, weather_code: 2, is_day: 0 } }));

    service.startPolling();
    tick(0);

    expect(httpGet).toHaveBeenCalled();
    const url = httpGet.mock.calls[httpGet.mock.calls.length - 1][0] as string;
    expect(url).toContain('latitude=48.8566');
    expect(url).toContain('longitude=2.3522');
  }));

  it('should use default coords when geolocation is not available', fakeAsync(() => {
    delete (navigator as any).geolocation;

    httpGet.mockReturnValue(of({ current: { temperature_2m: 3, weather_code: 4, is_day: 1 } }));

    service.startPolling();
    tick(0);

    expect(httpGet).toHaveBeenCalled();
    const url = httpGet.mock.calls[httpGet.mock.calls.length - 1][0] as string;
    expect(url).toContain('latitude=48.8566');
    expect(url).toContain('longitude=2.3522');
  }));

  it('should not update state when response has no current', fakeAsync(() => {
    (navigator as any).geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        success({ coords: { latitude: 10, longitude: 20 } } as any);
      },
    };

    httpGet.mockReturnValue(of({}));

    const values: Array<WeatherSnapshot | null> = [];
    service.weather$().subscribe((v) => values.push(v));

    service.startPolling();
    tick(0);

    expect(values).toEqual([null]);
  }));

  it('should handle http errors via catchError and not update state', fakeAsync(() => {
    (navigator as any).geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        success({ coords: { latitude: 10, longitude: 20 } } as any);
      },
    };

    httpGet.mockReturnValue(throwError(() => new Error('network')));

    const values: Array<WeatherSnapshot | null> = [];
    service.weather$().subscribe((v) => values.push(v));

    service.startPolling();
    tick(0);

    expect(values).toEqual([null]);
  }));
});
