import { render, screen, waitFor } from "@testing-library/angular";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import Health from "./health";

describe("Health Component", () => {
  it("should display loading state initially", async () => {
    await render(Health, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should display health status data when API responds successfully", async () => {
    await render(Health, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpTesting = TestBed.inject(HttpTestingController);

    const mockResponse = {
      message: "Server is running!",
      timestamp: "2025-10-16T12:00:00.000Z",
      status: "success",
    };

    const req = httpTesting.expectOne("/api/health/v1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);

    await waitFor(() => {
      expect(screen.getByText(/Server is running!/i)).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    httpTesting.verify();
  });

  it("should display error message when API fails", async () => {
    await render(Health, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpTesting = TestBed.inject(HttpTestingController);

    const req = httpTesting.expectOne("/api/health/v1");
    req.error(new ProgressEvent("Network error"));

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });

    httpTesting.verify();
  });

  it("should render the component with correct structure", async () => {
    await render(Health, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    expect(
      screen.getByRole("heading", { name: /Application health checker:/i })
    ).toBeInTheDocument();
  });

  it("should display all health data fields", async () => {
    await render(Health, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpTesting = TestBed.inject(HttpTestingController);

    const mockResponse = {
      message: "Server is running!",
      timestamp: "2025-10-16T12:00:00.000Z",
      status: "success",
    };

    httpTesting.expectOne("/api/health/v1").flush(mockResponse);

    await waitFor(() => {
      expect(screen.getByText(/Message:/i)).toBeInTheDocument();
      expect(screen.getByText(/Status:/i)).toBeInTheDocument();
      expect(screen.getByText(/Date & Time:/i)).toBeInTheDocument();
    });

    httpTesting.verify();
  });
});
