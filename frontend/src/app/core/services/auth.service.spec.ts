import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * ──────────────────────────────────────────────────────────────────────────
 * AuthService Tests
 *
 * What we test here:
 *  1. The service is created (basic sanity check)
 *  2. login() saves token, role, userId and updates signals
 *  3. logout() clears localStorage and resets signals
 *  4. getRole() / isAdmin() / isStaff() / isCustomer() helpers
 *  5. hasValidToken() detects missing token → returns false
 * ──────────────────────────────────────────────────────────────────────────
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // A sample JWT payload:  { sub: 'test@vpms.com', role: 'CUSTOMER', exp: far-future }
  // Built with base64url encoding so jwt-decode can parse it.
  const FAR_FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const payload = btoa(JSON.stringify({ sub: 'test@vpms.com', role: 'CUSTOMER', exp: FAR_FUTURE_EXP }));
  const FAKE_TOKEN = `header.${payload}.signature`;

  beforeEach(() => {
    // Clear localStorage before every test so tests are isolated
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();      // fail if any HTTP request was left unhandled
    localStorage.clear();   // clean up after each test
  });

  // ── 1. Service creation 
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── 2. Initial signal state when no token 
  it('should start with isLoggedIn = false when no token in localStorage', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should start with currentRole = null when no token in localStorage', () => {
    expect(service.currentRole()).toBeNull();
  });

  // ── 3. login() 
  it('login() should store token and update isLoggedIn signal to true', () => {
    service.login({ email: 'test@vpms.com', password: 'Test123' }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/users/login'));
    req.flush({ token: FAKE_TOKEN, role: 'CUSTOMER', userId: 42 });

    expect(service.isLoggedIn()).toBeTrue();
    expect(localStorage.getItem('vpms_token')).toBe(FAKE_TOKEN);
  });

  it('login() should set currentRole signal to the role returned by the API', () => {
    service.login({ email: 'test@vpms.com', password: 'Test123' }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/users/login'));
    req.flush({ token: FAKE_TOKEN, role: 'CUSTOMER', userId: 42 });

    expect(service.currentRole()).toBe('CUSTOMER');
  });

  it('login() should save userId to localStorage', () => {
    service.login({ email: 'test@vpms.com', password: 'Test123' }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/users/login'));
    req.flush({ token: FAKE_TOKEN, role: 'CUSTOMER', userId: 42 });

    expect(service.getUserId()).toBe(42);
  });

  // ── 4. logout() 
  it('logout() should clear localStorage and set isLoggedIn to false', () => {
    // Seed localStorage as if user was logged in
    localStorage.setItem('vpms_token', FAKE_TOKEN);
    localStorage.setItem('vpms_role', 'CUSTOMER');

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('vpms_token')).toBeNull();
    expect(localStorage.getItem('vpms_role')).toBeNull();
  });

  it('logout() should set currentRole to null', () => {
    localStorage.setItem('vpms_role', 'ADMIN');
    service.logout();
    expect(service.currentRole()).toBeNull();
  });

  // ── 5. Role helper methods 
  it('isAdmin() should return true when role is ADMIN', () => {
    localStorage.setItem('vpms_role', 'ADMIN');
    expect(service.isAdmin()).toBeTrue();
  });

  it('isAdmin() should return false when role is CUSTOMER', () => {
    localStorage.setItem('vpms_role', 'CUSTOMER');
    expect(service.isAdmin()).toBeFalse();
  });

  it('isStaff() should return true when role is STAFF', () => {
    localStorage.setItem('vpms_role', 'STAFF');
    expect(service.isStaff()).toBeTrue();
  });

  it('isCustomer() should return true when role is CUSTOMER', () => {
    localStorage.setItem('vpms_role', 'CUSTOMER');
    expect(service.isCustomer()).toBeTrue();
  });

  it('hasRole() should return true if role matches any of the given roles', () => {
    localStorage.setItem('vpms_role', 'STAFF');
    expect(service.hasRole('ADMIN', 'STAFF')).toBeTrue();
  });

  it('hasRole() should return false if role does not match', () => {
    localStorage.setItem('vpms_role', 'CUSTOMER');
    expect(service.hasRole('ADMIN', 'STAFF')).toBeFalse();
  });

  // ── 6. getToken / getEmail 
  it('getToken() should return null when nothing is stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getEmail() should return null when nothing is stored', () => {
    expect(service.getEmail()).toBeNull();
  });

  it('getUserId() should return null when nothing is stored', () => {
    expect(service.getUserId()).toBeNull();
  });
});
