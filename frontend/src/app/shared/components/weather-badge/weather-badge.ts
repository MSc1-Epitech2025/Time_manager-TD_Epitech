import { Component, ChangeDetectionStrategy, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherSnapshot } from '../../../core/services/weather';

@Component({
  selector: 'app-weather-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-badge.html',
  styleUrls: ['./weather-badge.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherBadgeComponent implements OnInit {
  @Input() variant: 'default' | 'compact' = 'default';

  snap = signal<WeatherSnapshot | null>(null);
  tempColor = signal<string>('#fff');

  constructor(private weather: WeatherService) {}

  ngOnInit(): void {
    this.weather.weather$().subscribe(s => {
      this.snap.set(s);
      if (s) this.tempColor.set(this.chooseTempColor(s.code, s.isDay));
    });
  }

  private chooseTempColor(code: number, isDay: boolean): string {
    const lightCodes = new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82]);
    const isLightEmoji = lightCodes.has(code);
    if (!isDay) return '#ffffff';
    return isLightEmoji ? '#1a1a1a' : '#ffffff';
  }

  codeToEmoji(code: number, isDay: boolean): string {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if ([1, 2].includes(code)) return isDay ? '🌤️' : '🌙';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67)) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌡️';
  }
}
