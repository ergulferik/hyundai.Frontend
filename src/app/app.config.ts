import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_BASE_HREF } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    { provide: APP_BASE_HREF, useValue: '/hyundai.Frontend/' },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } }
  ]
};
