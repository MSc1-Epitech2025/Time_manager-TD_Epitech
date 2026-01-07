import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ReportApiService } from './report-api';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);
  private reportApi = inject(ReportApiService);
  private auth = inject(AuthService);

  private open(msg: string, cfg: MatSnackBarConfig = {}) {
    this.snack.open(msg, 'OK', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top', ...cfg });
  }

  private sendToBackend(title: string, body: string) {
    const user = this.auth.session?.user;
    if (!user?.id) return;
    
    this.reportApi.createReport({
      targetUserId: user.id,
      title: title,
      body: body
    }).subscribe();
  }

  info(m: string) {
    this.open(m);
    this.sendToBackend('Info', m);
  }

  success(m: string) {
    this.open(m, { panelClass: ['snack-success'] });
    this.sendToBackend('Success', m);
  }

  warn(m: string) {
    this.open(m, { panelClass: ['snack-warn'] });
    this.sendToBackend('Warning', m);
  }

  error(m: string) {
    this.open(m, { panelClass: ['snack-error'] });
    this.sendToBackend('Error', m);
  }
}

