import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
}

@Component({
  selector: 'app-animated-bubbles',
  standalone: true,
  imports: [CommonModule, NgStyle],
  templateUrl: './animated-bubbles.html',
  styleUrls: ['./animated-bubbles.scss']
})
export class AnimatedBubblesComponent implements OnInit, OnDestroy {
  @Input() widthFactor: number = 1;
  @Input() bubbleCount: number = 3 + Math.random() * 7;
  @Input() enableMouseInteraction: boolean = true;

  bubbles: Bubble[] = [];
  private animationId?: number;
  mouse = { x: 0, y: 0, active: false };

  ngOnInit() {
    this.initBubbles();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  initBubbles() {
    const width = window.innerWidth * this.widthFactor;
    const height = window.innerHeight;

    this.bubbles = Array.from({ length: this.bubbleCount }).map(() => {
      const r = 20 + Math.random() * 80;
      return {
        x: Math.random() * (width - r * 2),
        y: Math.random() * (height - r * 2),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r,
        m: r * 0.5
      };
    });
  }

  onMouseMove(event: MouseEvent) {
    if (!this.enableMouseInteraction) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
    this.mouse.active = true;
  }

  onMouseLeave() {
    this.mouse.active = false;
  }

  animate() {
    const width = window.innerWidth * this.widthFactor;
    const height = window.innerHeight;

    const loop = () => {
      this.bubbles.forEach(b => {
        if (this.mouse.active && this.enableMouseInteraction) {
          const dx = b.x + b.r - this.mouse.x;
          const dy = b.y + b.r - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b.r * 1.8;

          if (dist < minDist) {
            const force = (1 - dist / minDist) * 2.5;
            const nx = dx / dist;
            const ny = dy / dist;
            b.vx += nx * force;
            b.vy += ny * force;
          }
        }

        b.vx = Math.max(Math.min(b.vx, 3), -3);
        b.vy = Math.max(Math.min(b.vy, 3), -3);

        b.x += b.vx * 1.8;
        b.y += b.vy * 1.8;

        if (b.x < 0) { b.x = 0; b.vx *= -1; }
        if (b.x + b.r * 2 > width) { b.x = width - b.r * 2; b.vx *= -1; }
        if (b.y < 0) { b.y = 0; b.vy *= -1; }
        if (b.y + b.r * 2 > height) { b.y = height - b.r * 2; b.vy *= -1; }
      });

      for (let i = 0; i < this.bubbles.length; i++) {
        for (let j = i + 1; j < this.bubbles.length; j++) {
          this.handleCollision(this.bubbles[i], this.bubbles[j]);
        }
      }

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  handleCollision(a: Bubble, b: Bubble) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.r + b.r;

    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      const p = 2 * (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny) / (a.m + b.m);

      a.vx -= p * b.m * nx;
      a.vy -= p * b.m * ny;
      b.vx += p * a.m * nx;
      b.vy += p * a.m * ny;

      const overlap = 0.5 * (minDist - dist + 0.1);
      a.x -= overlap * nx;
      a.y -= overlap * ny;
      b.x += overlap * nx;
      b.y += overlap * ny;
    }
  }

  getBubbleStyle(i: number) {
    const b = this.bubbles[i];
    return {
      transform: `translate(${b.x}px, ${b.y}px)`,
      width: `${b.r * 2}px`,
      height: `${b.r * 2}px`
    };
  }
}
