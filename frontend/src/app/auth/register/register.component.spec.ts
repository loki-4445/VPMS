import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';

/**
 * ──────────────────────────────────────────────────────────────────────────
 * RegisterComponent Tests
 *
 * What we test:
 *  1. Component renders
 *  2. Form starts invalid (all empty)
 *  3. Name field — required, pattern (letters only, 2-50 chars)
 *  4. Email field — required, pattern
 *  5. Phone field — required, exactly 10 digits
 *  6. Password — required, minLength 6, must have letter + number
 *  7. Confirm password — must match password (cross-field validator)
 *  8. Valid full form
 *  9. Signals initial states
 * ──────────────────────────────────────────────────────────────────────────
 */
describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. Component created 
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. Empty form is invalid 
  it('form should be invalid when all fields are empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  // ── 3. Name field 
  it('name field should be required', () => {
    component.nameCtrl.setValue('');
    expect(component.nameCtrl.hasError('required')).toBeTrue();
  });

  it('name field should reject single character', () => {
    component.nameCtrl.setValue('A');
    expect(component.nameCtrl.hasError('pattern')).toBeTrue();
  });

  it('name field should reject numbers in name', () => {
    component.nameCtrl.setValue('User123');
    expect(component.nameCtrl.hasError('pattern')).toBeTrue();
  });

  it('name field should accept valid name with letters and spaces', () => {
    component.nameCtrl.setValue('Rahul Kumar');
    expect(component.nameCtrl.valid).toBeTrue();
  });

  // ── 4. Email field 
  it('email field should be required', () => {
    component.emailCtrl.setValue('');
    expect(component.emailCtrl.hasError('required')).toBeTrue();
  });

  it('email field should reject missing @ symbol', () => {
    component.emailCtrl.setValue('rahulgmail.com');
    expect(component.emailCtrl.hasError('pattern')).toBeTrue();
  });

  it('email field should accept valid email', () => {
    component.emailCtrl.setValue('rahul@gmail.com');
    expect(component.emailCtrl.valid).toBeTrue();
  });

  // ── 5. Phone field 
  it('phone field should be required', () => {
    component.phoneCtrl.setValue('');
    expect(component.phoneCtrl.hasError('required')).toBeTrue();
  });

  it('phone field should reject less than 10 digits', () => {
    component.phoneCtrl.setValue('12345');
    expect(component.phoneCtrl.hasError('pattern')).toBeTrue();
  });

  it('phone field should reject letters', () => {
    component.phoneCtrl.setValue('ABCD123456');
    expect(component.phoneCtrl.hasError('pattern')).toBeTrue();
  });

  it('phone field should accept exactly 10 digits', () => {
    component.phoneCtrl.setValue('9876543210');
    expect(component.phoneCtrl.valid).toBeTrue();
  });

  // ── 6. Password field 
  it('password should be required', () => {
    component.pwdCtrl.setValue('');
    expect(component.pwdCtrl.hasError('required')).toBeTrue();
  });

  it('password should reject less than 6 characters', () => {
    component.pwdCtrl.setValue('Ab1');
    expect(component.pwdCtrl.hasError('minlength')).toBeTrue();
  });

  it('password should reject all letters (no number)', () => {
    component.pwdCtrl.setValue('abcdefg');
    expect(component.pwdCtrl.hasError('pattern')).toBeTrue();
  });

  it('password should reject all numbers (no letter)', () => {
    component.pwdCtrl.setValue('123456');
    expect(component.pwdCtrl.hasError('pattern')).toBeTrue();
  });

  it('password should accept mix of letters and numbers', () => {
    component.pwdCtrl.setValue('Pass123');
    expect(component.pwdCtrl.valid).toBeTrue();
  });

  // ── 7. Cross-field password match 
  it('form should have mismatch error when passwords do not match', () => {
    component.pwdCtrl.setValue('Pass123');
    component.confirmCtrl.setValue('Pass456');
    expect(component.form.hasError('mismatch')).toBeTrue();
  });

  it('form should NOT have mismatch error when passwords match', () => {
    component.pwdCtrl.setValue('Pass123');
    component.confirmCtrl.setValue('Pass123');
    expect(component.form.hasError('mismatch')).toBeFalse();
  });

  it('passwordsMismatch getter should return true when passwords differ and confirm is touched', () => {
    component.pwdCtrl.setValue('Pass123');
    component.confirmCtrl.setValue('Different1');
    component.confirmCtrl.markAsTouched();
    expect(component.passwordsMismatch).toBeTrue();
  });

  it('passwordsMatch getter should return true when passwords match and confirm is touched', () => {
    component.pwdCtrl.setValue('Pass123');
    component.confirmCtrl.setValue('Pass123');
    component.confirmCtrl.markAsTouched();
    expect(component.passwordsMatch).toBeTrue();
  });

  // ── 8. Fully valid form 
  it('form should be valid when all fields are correctly filled', () => {
    component.nameCtrl.setValue('Rahul Kumar');
    component.emailCtrl.setValue('rahul@gmail.com');
    component.phoneCtrl.setValue('9876543210');
    component.pwdCtrl.setValue('Pass123');
    component.confirmCtrl.setValue('Pass123');
    expect(component.form.valid).toBeTrue();
  });

  // ── 9. Signals initial states 
  it('loading signal should start as false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('error signal should start as empty string', () => {
    expect(component.error()).toBe('');
  });

  it('showPassword signal should start as false', () => {
    expect(component.showPassword()).toBeFalse();
  });

  it('showConfirm signal should start as false', () => {
    expect(component.showConfirm()).toBeFalse();
  });
});
