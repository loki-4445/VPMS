import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

// ── Cross-field validator: confirmPassword must match password 
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pwd     = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (pwd && confirm && pwd !== confirm) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private userSvc = inject(UserService);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);

  // ── Signals (unchanged) 
  loading     = signal(false);
  error       = signal('');
  showPassword = signal(false);
  showConfirm  = signal(false);

  // ── Reactive form with regex validators 
  form: FormGroup = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z ]{2,50}$/)         
    ]],
    email: ['', [
      Validators.required,
      Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)  
    ]],
    phoneNumber: ['', [
      Validators.required,
      Validators.pattern(/^\d{10}$/)                   
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/)  
    ]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  // ── Shortcut getters 
  get nameCtrl()    { return this.form.get('name')!; }
  get emailCtrl()   { return this.form.get('email')!; }
  get phoneCtrl()   { return this.form.get('phoneNumber')!; }
  get pwdCtrl()     { return this.form.get('password')!; }
  get confirmCtrl() { return this.form.get('confirmPassword')!; }

  // ── Password match helpers (kept for template compat) 
  get passwordsMatch() {
    return this.pwdCtrl.value && this.confirmCtrl.value &&
           this.confirmCtrl.touched && !this.form.hasError('mismatch');
  }
  get passwordsMismatch() {
    return this.confirmCtrl.touched && this.form.hasError('mismatch');
  }

  private parseError(err: any, fallback: string): string {
    if (err.status === 0)   return 'Cannot connect to server. Please make sure the backend is running.';
    if (err.status === 409) return 'An account with this email already exists. Please log in or use a different email.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  // ── Register (backend call unchanged) 
  register() {
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    this.userSvc.register({
      name:        this.nameCtrl.value.trim(),
      email:       this.emailCtrl.value.trim(),
      phoneNumber: this.phoneCtrl.value,
      password:    this.pwdCtrl.value,
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
