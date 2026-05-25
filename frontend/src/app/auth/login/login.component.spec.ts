import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

/**
 * ──────────────────────────────────────────────────────────────────────────
 * LoginComponent Tests
 *
 * What we test:
 *  1. Component renders (created)
 *  2. Form starts invalid (empty)
 *  3. Email field — required + pattern validators
 *  4. Password field — required + minLength validators
 *  5. Valid form — both fields filled correctly → form.valid = true
 *  6. Signals: loading, error, showPassword initial states
 *  7. showPassword toggles correctly
 * ──────────────────────────────────────────────────────────────────────────
 */
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,             // standalone component — import directly
        ReactiveFormsModule
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();        // triggers ngOnInit
  });

  // ── 1. Component created ───────────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. Form starts invalid ─────────────────────────────────────────────
  it('form should be invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  // ── 3. Email validators ────────────────────────────────────────────────
  it('email field should be required', () => {
    const email = component.emailCtrl;
    email.setValue('');
    expect(email.hasError('required')).toBeTrue();
  });

  it('email field should reject invalid email format', () => {
    const email = component.emailCtrl;
    email.setValue('notanemail');
    expect(email.hasError('pattern')).toBeTrue();
  });

  it('email field should accept valid email', () => {
    const email = component.emailCtrl;
    email.setValue('user@vpms.com');
    expect(email.valid).toBeTrue();
  });

  // ── 4. Password validators 
  it('password field should be required', () => {
    const pwd = component.passwordCtrl;
    pwd.setValue('');
    expect(pwd.hasError('required')).toBeTrue();
  });

  it('password field should reject passwords shorter than 6 characters', () => {
    const pwd = component.passwordCtrl;
    pwd.setValue('ab1');
    expect(pwd.hasError('minlength')).toBeTrue();
  });

  it('password field should accept password with 6+ characters', () => {
    const pwd = component.passwordCtrl;
    pwd.setValue('Test123');
    expect(pwd.valid).toBeTrue();
  });

  // ── 5. Valid form 
  it('form should be valid when email and password are correctly filled', () => {
    component.form.setValue({ email: 'user@vpms.com', password: 'Test123' });
    expect(component.form.valid).toBeTrue();
  });

  // ── 6. Initial signal states 
  it('loading signal should start as false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('error signal should start as empty string', () => {
    expect(component.error()).toBe('');
  });

  it('showPassword signal should start as false', () => {
    expect(component.showPassword()).toBeFalse();
  });

  // ── 7. showPassword toggle 
  it('showPassword should toggle from false to true', () => {
    component.showPassword.update(v => !v);
    expect(component.showPassword()).toBeTrue();
  });

  it('showPassword should toggle back to false', () => {
    component.showPassword.set(true);
    component.showPassword.update(v => !v);
    expect(component.showPassword()).toBeFalse();
  });

  // ── 8. login() should NOT call API when form is invalid 
  it('login() should mark form as touched and not submit when form is invalid', () => {
    spyOn(component['auth'], 'login').and.callThrough();
    component.login();
    expect(component.form.touched).toBeTrue();
    expect(component['auth'].login).not.toHaveBeenCalled();
  });
});
