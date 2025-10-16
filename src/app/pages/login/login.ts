import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import Card from "@components/card/card";
import { NgpButton } from "ng-primitives/button";

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: "app-login-card-page",
  imports: [
    CommonModule,
    Card,
    NgpButton,
    NgOptimizedImage,
    RouterLink,
    ReactiveFormsModule,
  ],
  template: `
    <dialog
      open
      class="flex justify-self-center align-self-center bg-transparent"
    >
      <form class="z-10" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <app-card
          [titleTemplate]="cardTitle"
          [contentTemplate]="cardContent"
          [footerTemplate]="cardFooter"
        />
        <ng-template #cardTitle>
          <!-- TODO: Replace the image for your system/company logo -->
          <div class="flex flex-col gap-4 mt-4">
            <img
              ngSrc="favicon.ico"
              width="47"
              height="40"
              alt="Your Company"
              class="mx-auto h-10 w-auto"
            />
            <div class="text-center mb-8">Ingresar al sistema</div>
          </div>
        </ng-template>

        <ng-template #cardContent>
          <div class="flex flex-col gap-6 w-96">
            <div>
              <label
                for="email"
                class="block text-sm/6 font-medium text-gray-900"
                >Dirección de email</label
              >
              <div class="mt-2">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                @if ( loginForm.controls.email.invalid &&
                loginForm.controls.email.dirty ) {
                <p class="mt-2 text-sm text-danger-600">
                  @if (loginForm.controls.email.errors?.['required']) { El email
                  es requerido } @if
                  (loginForm.controls.email.errors?.['email']) { Ingrese un
                  email válido }
                </p>
                }
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label
                  for="password"
                  class="block text-sm/6 font-medium text-gray-900"
                  >Contraseña</label
                >
                <div class="text-sm">
                  <a
                    [routerLink]="resetPassword"
                    class="font-semibold text-primary-600 hover:text-primary-500"
                    >¿Olvidaste tu contraseña?</a
                  >
                </div>
              </div>
              <div class="mt-2">
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                @if ( loginForm.controls.password.invalid &&
                loginForm.controls.password.touched ) {
                <p class="mt-2 text-sm text-danger-600">
                  @if (loginForm.controls.password.errors?.['required']) { La
                  contraseña es requerida } @if
                  (loginForm.controls.password.errors?.['minlength']) { La
                  contraseña debe tener al menos 8 caracteres }
                </p>
                }
              </div>
            </div>
          </div>
        </ng-template>

        <ng-template #cardFooter>
          <div class="flex justify-center font-semibold">
            <button
              class="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 text-white shadow-xs
          hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer
          disabled:bg-gray-400 disabled:cursor-not-allowed"
              ngpButton
              type="submit"
              [disabled]="loginForm.invalid"
            >
              Iniciar sesión
            </button>
          </div>
        </ng-template>
      </form>
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @reference "tailwindcss";
    :host {
      @apply bg-gray-500 flex items-center justify-center h-svh w-svw 
    }
  `,
})
export default class Login {
  router = inject(Router);

  readonly resetPassword = this.router.createUrlTree(["/auth/reset-password"]);

  readonly loginForm = new FormGroup<LoginForm>({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    console.log("Login attempt:", { email, password });

    // TODO: Implement actual login logic
    // this.router.navigate(["/dashboard"]);
  }
}
