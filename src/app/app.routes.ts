import { Routes } from '@angular/router';
import { UserFormComponent } from './pages/user-form/user-form.component';
import { LogViewerComponent } from './pages/log-viewer/log-viewer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'user-form', pathMatch: 'full' },
  { path: 'user-form', component: UserFormComponent },
  { path: 'logs', component: LogViewerComponent }
];
