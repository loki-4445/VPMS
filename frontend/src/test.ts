// This file is the entry point for the Karma test runner.
// It loads all spec files matching the pattern below.
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialize the Angular testing environment once for the whole suite.
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);
