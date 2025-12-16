import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule, NgStyle,
    MatButtonModule, MatIconModule, MatCardModule, MatRippleModule
  ],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class HomepageComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  theme = signal<'light' | 'dark'>('light');
  particles: Particle[] = [];
  private animationId?: number;

  ngOnInit() {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('tm-theme') as 'light' | 'dark' | null;
    this.setTheme(saved ?? (prefersDark ? 'dark' : 'light'));

    this.initParticles();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  initParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const particleCount = 25;

    this.particles = Array.from({ length: particleCount }).map(() => {
      const r = 2 + Math.random() * 4;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r
      };
    });
  }

  animate() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  getParticleStyle(i: number) {
    const p = this.particles[i];
    return {
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.r}px`,
      height: `${p.r}px`
    };
  }

  setTheme(t: 'light' | 'dark') {
    this.theme.set(t);
    document.documentElement.className = `theme-${t}`;
    localStorage.setItem('tm-theme', t);
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onContact() {
    // non-functional
  }
}
