import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private fb     = inject(FormBuilder);

  // ── Signals (unchanged) 
  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);
  registered   = signal(false);

  // ── Reactive form 
  form: FormGroup = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)  
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]]
  });

  // ── Shortcut getters 
  get emailCtrl()    { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['registered'] === 'true') this.registered.set(true);
    });
  }

  private parseError(err: any, fallback: string): string {
    if (err.status === 0) return 'Cannot connect to server. Please make sure the backend is running.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  // ── Login (backend call unchanged) 
  login() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.login({
      email:    this.emailCtrl.value.trim(),
      password: this.passwordCtrl.value
    }).subscribe({
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
