import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

type OpenMeteoCurrent = {
  temperature_2m: number;
  weather_code: number;
  is_day: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: OpenMeteoCurrent;
};

export type WeatherSnapshot = {
  tempC: number;
  code: number;
  isDay: boolean;
  asOf: number;
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly defaultLat = 48.8566;
  private readonly defaultLon = 2.3522;

  private readonly api = 'https://api.open-meteo.com/v1/forecast';

  private state$ = new BehaviorSubject<WeatherSnapshot | null>(null);

  constructor(private http: HttpClient) { }

  public weather$(): Observable<WeatherSnapshot | null> {
    return this.state$.asObservable();
  }
  startPolling(): void {
    timer(0, 5 * 60 * 1000)
      .pipe(
        switchMap(() =>
          new Observable<{ lat: number; lon: number }>((sub) => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  sub.next({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                  });
                  sub.complete();
                },
                () => {
                  sub.next({ lat: this.defaultLat, lon: this.defaultLon });
                  sub.complete();
                },
                { enableHighAccuracy: false, timeout: 4000 }
              );
            } else {
              sub.next({ lat: this.defaultLat, lon: this.defaultLon });
              sub.complete();
            }
          })
        ),
        switchMap(({ lat, lon }) =>
          this.http.get<OpenMeteoResponse>(
            `${this.api}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`
          )
        ),
        catchError((err, _caught) => {
          return [];
        })
      )
      .subscribe((res: any) => {
        if (!res?.current) return;
        const snap: WeatherSnapshot = {
          tempC: res.current.temperature_2m,
          code: res.current.weather_code,
          isDay: !!res.current.is_day,
          asOf: Date.now(),
        };
        this.state$.next(snap);
      });
  }
}
