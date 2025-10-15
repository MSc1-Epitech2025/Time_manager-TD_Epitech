import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AuthService } from './core/services/auth';
import { TimerService } from './core/services/timer';
import { AuthInterceptor } from './core/services/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    provideHttpClient(withInterceptorsFromDi()),

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.hydrateFromStorage(),
      deps: [AuthService],
      multi: true,
    },

    {
      provide: APP_INITIALIZER,
      useFactory: (t: TimerService) => () => t.hydrate(),
      deps: [TimerService],
      multi: true,
    },
  ],
};
