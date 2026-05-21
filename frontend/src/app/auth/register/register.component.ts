import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private userSvc = inject(UserService);
  private router = inject(Router);

  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);
  showConfirm  = signal(false);
  submitted    = signal(false);

  touched = {
    name:            false,
    email:           false,
    phoneNumber:     false,
    password:        false,
    confirmPassword: false
  };

  form = {
    name:            '',
    email:           '',
    phoneNumber:     '',
    password:        '',
    confirmPassword: ''
  };

  /** Mark a field dirty on blur so its error appears immediately. */
  touch(field: keyof typeof this.touched) {
    this.touched[field] = true;
  }

  /** Strip any non-digit characters while the user types in the phone field. */
  onPhoneInput() {
    this.form.phoneNumber = this.form.phoneNumber.replace(/\D/g, '').slice(0, 10);
  }

  // ── Validation rules (always computed live from current values) ──

  get nameError(): string | null {
    const v = this.form.name.trim();
    if (!v) return 'Full name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    if (/\d/.test(v)) return 'Name must not contain numbers.';
    if (!/^[a-zA-Z\s'\-]+$/.test(v)) return 'Name may only contain letters, spaces, hyphens and apostrophes.';
    return null;
  }

  get emailError(): string | null {
    const v = this.form.email.trim();
    if (!v) return 'Email is required.';
    if (!v.includes('@')) return 'Email must contain @.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return 'Enter a valid email address (e.g. you@example.com).';
    return null;
  }

  get phoneError(): string | null {
    const v = this.form.phoneNumber;
    if (!v) return 'Phone number is required.';
    if (/\D/.test(v)) return 'Phone number must contain digits only.';
    if (v.length < 10) return `Must be exactly 10 digits (${v.length}/10 entered).`;
    return null;
  }

  get passwordError(): string | null {
    const v = this.form.password;
    if (!v) return 'Password is required.';
    if (v.length < 6) return `Password must be at least 6 characters (${v.length}/6).`;
    if (/^\d+$/.test(v)) return 'Password must not be numbers only — add some letters.';
    return null;
  }

  get confirmPasswordError(): string | null {
    const v = this.form.confirmPassword;
    if (!v) return 'Please confirm your password.';
    if (v !== this.form.password) return 'Passwords do not match.';
    return null;
  }

  // ── Show error only after the field is touched OR form submitted ──

  get showNameError()    { return (this.touched.name            || this.submitted()) && this.nameError; }
  get showEmailError()   { return (this.touched.email           || this.submitted()) && this.emailError; }
  get showPhoneError()   { return (this.touched.phoneNumber     || this.submitted()) && this.phoneError; }
  get showPasswordError(){ return (this.touched.password        || this.submitted()) && this.passwordError; }
  get showConfirmError() { return (this.touched.confirmPassword || this.submitted()) && this.confirmPasswordError; }

  // ── "All good" indicator — show green only when touched AND valid ─

  get showNameOk()    { return this.touched.name            && !this.nameError; }
  get showEmailOk()   { return this.touched.email           && !this.emailError; }
  get showPhoneOk()   { return this.touched.phoneNumber     && !this.phoneError; }
  get showPasswordOk(){ return this.touched.password        && !this.passwordError; }
  get showConfirmOk() { return this.touched.confirmPassword && !this.confirmPasswordError; }

  /** Returns 'error' | 'ok' | '' to drive the input border class. */
  inputState(field: keyof typeof this.touched): 'error' | 'ok' | '' {
    const active = this.touched[field] || this.submitted();
    if (!active) return '';
    const errorMap: Record<keyof typeof this.touched, string | null> = {
      name:            this.nameError,
      email:           this.emailError,
      phoneNumber:     this.phoneError,
      password:        this.passwordError,
      confirmPassword: this.confirmPasswordError
    };
    return errorMap[field] ? 'error' : 'ok';
  }

  private get hasErrors(): boolean {
    return !!(
      this.nameError || this.emailError || this.phoneError ||
      this.passwordError || this.confirmPasswordError
    );
  }

  private parseError(err: any, fallback: string): string {
    if (err.status === 0) return 'Cannot connect to server. Please make sure the backend is running.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  register() {
    // Mark every field touched so all errors surface at once
    this.submitted.set(true);
    this.touched = {
      name: true, email: true, phoneNumber: true,
      password: true, confirmPassword: true
    };

    if (this.hasErrors) return;

    this.loading.set(true);
    this.error.set('');

    this.userSvc.register({
      name:        this.form.name.trim(),
      email:       this.form.email.trim(),
      phoneNumber: this.form.phoneNumber,
      password:    this.form.password,
      role:        'CUSTOMER'
    }).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { registered: 'true' } }),
      error: err => {
        this.loading.set(false);
        this.error.set(this.parseError(err, 'Registration failed. Please try again.'));
      }
    });
  }
}
