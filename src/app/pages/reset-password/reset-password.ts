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

interface ResetPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: "app-reset-password-page",
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
      <form
        class="z-10"
        [formGroup]="resetPasswordForm"
        (ngSubmit)="onSubmit()"
      >
        <app-card
          [titleTemplate]="cardTitle"
          [contentTemplate]="cardContent"
          [footerTemplate]="cardFooter"
        />
        <ng-template #cardTitle>
          <div class="flex flex-col gap-4 mt-4">
            <img
              ngSrc="favicon.ico"
              width="47"
              height="40"
              alt="Your Company"
              class="mx-auto h-10 w-auto"
            />
            <div class="text-center mb-8">Restablecer contraseña</div>
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
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                />
                @if ( resetPasswordForm.controls.email.invalid &&
                resetPasswordForm.controls.email.touched ) {
                <p class="mt-2 text-sm text-danger-600">
                  @if (resetPasswordForm.controls.email.errors?.['required']) {
                  El email es requerido } @if
                  (resetPasswordForm.controls.email.errors?.['email']) { Ingrese
                  un email válido }
                </p>
                }
              </div>
            </div>
          </div>
        </ng-template>

        <ng-template #cardFooter>
          <div class="flex flex-col gap-4 font-semibold">
            <button
              class="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 text-white shadow-xs
          hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer
          disabled:bg-gray-400 disabled:cursor-not-allowed"
              ngpButton
              type="submit"
              [disabled]="resetPasswordForm.invalid"
            >
              Enviar enlace de restablecimiento
            </button>

            <div class="text-center text-sm text-gray-600">
              <a
                [routerLink]="loginUrl"
                class="font-semibold text-primary-600 hover:text-primary-500"
                >Volver al inicio de sesión</a
              >
            </div>
          </div>
        </ng-template>
      </form>
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @reference "tailwindcss";
    :host {
      @apply bg-gray-500 flex items-center justify-center h-svh w-svw;
    }
  `,
})
export default class ResetPassword {
  router = inject(Router);

  readonly loginUrl = this.router.createUrlTree(["/auth/login"]);

  readonly resetPasswordForm = new FormGroup<ResetPasswordForm>({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const { email } = this.resetPasswordForm.value;
    console.log("Password reset requested for:", email);

    // TODO: Implement actual password reset logic
    // After successful request, could navigate to a confirmation page
    // this.router.navigate(["/reset-password-sent"]);
  }
}
