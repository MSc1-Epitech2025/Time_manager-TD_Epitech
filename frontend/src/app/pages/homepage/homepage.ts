import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';

// Shared components
import { AnimatedBubblesComponent } from '../../shared/components/animated-bubbles/animated-bubbles';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatCardModule, MatRippleModule,
    AnimatedBubblesComponent
  ],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class HomepageComponent implements OnInit {
  private router = inject(Router);

  theme = signal<'light' | 'dark'>('light');

  ngOnInit() {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('tm-theme') as 'light' | 'dark' | null;
    this.setTheme(saved ?? (prefersDark ? 'dark' : 'light'));
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
