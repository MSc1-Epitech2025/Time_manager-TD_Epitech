// src/app/core/services/weather.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

type OpenMeteoCurrent = {
  temperature_2m: number;
  weather_code: number;
  is_day: number; // 1 = jour, 0 = nuit
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
  asOf: number; // epoch ms
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  // Paris par défaut (sécurisé / pas de géoloc sans consentement)
  private readonly defaultLat = 48.8566;
  private readonly defaultLon = 2.3522;

  private readonly api = 'https://api.open-meteo.com/v1/forecast';

  private state$ = new BehaviorSubject<WeatherSnapshot | null>(null);

  constructor(private http: HttpClient) { }

  /**
   * Expose un Observable avec la météo “courante” (rafraîchie en tâche réactive).
   */
  public weather$(): Observable<WeatherSnapshot | null> {
    return this.state$.asObservable();
  }

  /**
   * Démarre un polling toutes les 5 minutes. Appelle-le une seule fois (ex: dans AppComponent).
   * Si l'utilisateur refuse la géoloc, on reste sur Paris.
   */
  startPolling(): void {
    // Au tick 0, puis toutes les 5 min
    timer(0, 5 * 60 * 1000)
      .pipe(
        switchMap(() =>
          new Observable<{ lat: number; lon: number }>((sub) => {
            // Essaie la géoloc navigateur (https, consentement requis)
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
          console.warn('[Weather] fetch error:', err);
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
