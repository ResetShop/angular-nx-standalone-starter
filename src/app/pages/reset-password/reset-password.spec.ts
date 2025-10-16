import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { provideRouter } from "@angular/router";
import ResetPassword from "./reset-password";

describe("ResetPassword", () => {
  it("should create the reset password component", async () => {
    const { fixture } = await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the reset password form with email field", async () => {
    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    expect(screen.getByLabelText(/dirección de email/i)).toBeInTheDocument();
  });

  it("should have submit button disabled when form is invalid", async () => {
    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const submitButton = screen.getByRole("button", {
      name: /enviar enlace de restablecimiento/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("should show required error for email when touched and empty", async () => {
    const user = userEvent.setup();

    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const emailInput = screen.getByLabelText(/dirección de email/i);
    await user.click(emailInput);
    await user.tab();

    expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
  });

  it("should show invalid email error when email format is incorrect", async () => {
    const user = userEvent.setup();

    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const emailInput = screen.getByLabelText(/dirección de email/i);
    await user.type(emailInput, "invalid-email");
    await user.tab();

    expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();
  });

  it("should enable submit button when form is valid", async () => {
    const user = userEvent.setup();

    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const emailInput = screen.getByLabelText(/dirección de email/i);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByRole("button", {
      name: /enviar enlace de restablecimiento/i,
    });
    expect(submitButton).not.toBeDisabled();
  });

  it("should render back to login link", async () => {
    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const backToLoginLink = screen.getByText(/volver al inicio de sesión/i);
    expect(backToLoginLink).toBeInTheDocument();
  });

  it("should display the reset password title", async () => {
    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    expect(screen.getByText(/restablecer contraseña/i)).toBeInTheDocument();
  });

  it("should have correct form structure with formGroup directive", async () => {
    const { container } = await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();

    const emailInput = container.querySelector(
      'input[formcontrolname="email"]'
    );
    expect(emailInput).toBeInTheDocument();
  });

  it("should not show error messages when form is untouched", async () => {
    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    expect(
      screen.queryByText(/el email es requerido/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/ingrese un email válido/i)
    ).not.toBeInTheDocument();
  });

  it("should clear error when valid email is entered", async () => {
    const user = userEvent.setup();

    await render(ResetPassword, {
      providers: [provideRouter([])],
    });

    const emailInput = screen.getByLabelText(/dirección de email/i);

    // First, trigger error
    await user.type(emailInput, "invalid");
    await user.tab();
    expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();

    // Then, fix the email
    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");
    await user.tab();

    expect(
      screen.queryByText(/ingrese un email válido/i)
    ).not.toBeInTheDocument();
  });
});
