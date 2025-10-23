import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, map, startWith, Subscription } from 'rxjs';

const CLOCK_KEY = 'tm.clockInAt';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private tickSub?: Subscription;
  private _elapsedSec$ = new BehaviorSubject<number>(0);
  elapsedSec$ = this._elapsedSec$.asObservable();

  get clockInAt(): number | null {
    const raw = localStorage.getItem(CLOCK_KEY);
    return raw ? Number(raw) : null;
  }

  startClock(now = Date.now()) {
    localStorage.setItem(CLOCK_KEY, String(now));
    this.startTicker();
  }

  stopClock() {
    localStorage.removeItem(CLOCK_KEY);
    this._elapsedSec$.next(0);
    this.tickSub?.unsubscribe();
  }

  hydrate() {
    if (this.clockInAt) this.startTicker();
  }

  private startTicker() {
    const clockIn = this.clockInAt!;
    this.tickSub?.unsubscribe();
    this.tickSub = interval(1000).pipe(
      startWith(0),
      map(() => Math.floor((Date.now() - clockIn) / 1000))
    ).subscribe(v => this._elapsedSec$.next(v));
  }
}
