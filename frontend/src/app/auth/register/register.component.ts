import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="text-center mb-4">
          <h2 class="auth-title">Register</h2>
          <p class="text-muted">Daftar akun baru</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label for="name" class="form-label">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              class="form-control"
              formControlName="name"
              [class.is-invalid]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched"
              placeholder="Masukkan nama lengkap"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('name')?.invalid && registerForm.get('name')?.touched">
              <div *ngIf="registerForm.get('name')?.errors?.['required']">Nama wajib diisi</div>
              <div *ngIf="registerForm.get('name')?.errors?.['minlength']">Nama minimal 2 karakter</div>
            </div>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              id="email"
              class="form-control"
              formControlName="email"
              [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
              placeholder="Masukkan email"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              <div *ngIf="registerForm.get('email')?.errors?.['required']">Email wajib diisi</div>
              <div *ngIf="registerForm.get('email')?.errors?.['email']">Format email tidak valid</div>
            </div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              id="password"
              class="form-control"
              formControlName="password"
              [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
              placeholder="Masukkan password"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              <div *ngIf="registerForm.get('password')?.errors?.['required']">Password wajib diisi</div>
              <div *ngIf="registerForm.get('password')?.errors?.['minlength']">Password minimal 6 karakter</div>
            </div>
          </div>

          <div class="mb-3">
            <label for="role" class="form-label">Role</label>
            <select
              id="role"
              class="form-select"
              formControlName="role"
            >
              <option value="CS">Customer Service</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            [disabled]="registerForm.invalid || isLoading"
          >
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoading ? 'Mendaftar...' : 'Daftar' }}
          </button>

          <div class="text-center">
            <span class="text-muted">Sudah punya akun? </span>
            <a [routerLink]="['/auth/login']" class="text-decoration-none">Login di sini</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color), var(--success-color));
      padding: 20px;
    }

    .auth-card {
      background: white;
      border-radius: 10px;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }

    .auth-title {
      color: var(--primary-color);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .form-control:focus,
    .form-select:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .btn-primary {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .btn-primary:hover {
      background-color: #0056b3;
      border-color: #0056b3;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['CS']
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || 'Registrasi gagal. Silakan coba lagi.';
        }
      });
    }
  }
}