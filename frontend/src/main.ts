import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Suppress Angular's internal development mode warning in the console
const _warn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('development mode')) return;
  _warn(...args);
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
