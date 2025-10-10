import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);
  private open(msg: string, cfg: MatSnackBarConfig = {}) {
    this.snack.open(msg, 'OK', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top', ...cfg });
  }
  info(m: string)    { this.open(m); }
  success(m: string) { this.open(m, { panelClass: ['snack-success'] }); }
  warn(m: string)    { this.open(m, { panelClass: ['snack-warn'] }); }
  error(m: string)   { this.open(m, { panelClass: ['snack-error'] }); }
}
