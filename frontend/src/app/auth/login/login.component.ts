import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';

  loading    = signal(false);
  error      = signal('');
  showPassword = signal(false);
  registered = signal(false);
  submitted  = signal(false);

  touched = { email: false, password: false };

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['registered'] === 'true') this.registered.set(true);
    });
  }

  /** Mark a field dirty on blur so its error appears immediately. */
  touch(field: keyof typeof this.touched) {
    this.touched[field] = true;
  }

  // ── Validation rules (always computed live) ──────────────────────

  get emailError(): string | null {
    const v = this.email.trim();
    if (!v) return 'Email is required.';
    if (!v.includes('@')) return 'Email must contain @.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return 'Enter a valid email address (e.g. you@example.com).';
    return null;
  }

  get passwordError(): string | null {
    const v = this.password;
    if (!v) return 'Password is required.';
    if (v.length < 6) return `Password must be at least 6 characters (${v.length}/6).`;
    return null;
  }

  // ── Show only after the field is touched OR form submitted ────────

  get showEmailError()    { return (this.touched.email    || this.submitted()) && this.emailError; }
  get showPasswordError() { return (this.touched.password || this.submitted()) && this.passwordError; }

  /** Used to colour the input border: 'error' | 'ok' | '' */
  inputState(field: 'email' | 'password'): 'error' | 'ok' | '' {
    if (!this.touched[field] && !this.submitted()) return '';
    return (field === 'email' ? this.emailError : this.passwordError) ? 'error' : 'ok';
  }

  private parseError(err: any, fallback: string): string {
    if (err.status === 0) return 'Cannot connect to server. Please make sure the backend is running.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  login() {
    // Mark everything touched so all errors surface at once
    this.submitted.set(true);
    this.touched = { email: true, password: true };

    if (this.emailError || this.passwordError) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(this.parseError(err, 'Invalid credentials. Please try again.'));
      }
    });
  }
}
