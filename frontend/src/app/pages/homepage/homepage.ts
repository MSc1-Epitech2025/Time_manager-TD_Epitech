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

  ngOnInit() {
    // Force dark theme
    document.documentElement.className = 'theme-dark';
    localStorage.setItem('tm-theme', 'dark');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onContact() {
    // non-functional
  }
}
