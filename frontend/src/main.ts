import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { TokenInterceptor } from './app/core/services/token-interceptor';

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.add(prefersDark ? 'theme-dark' : 'theme-light');

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(withInterceptors([TokenInterceptor]))
  ]
}).catch((err) => console.error(err));
