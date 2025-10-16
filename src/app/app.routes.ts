import { Route } from "@angular/router";

export const validRoutes = [
  "",
  "health",
  "auth",
  "auth/login",
  "auth/reset-password",
];

export const appRoutes: Route[] = [
  {
    path: "welcome",
    loadComponent: () => import("./pages/welcome/welcome"),
  },
  {
    path: "health",
    loadComponent: () => import("./pages/health/health"),
  },
  {
    path: "auth",
    children: [
      {
        path: "login",
        loadComponent: () => import("./pages/login/login"),
      },
      {
        path: "reset-password",
        loadComponent: () => import("./pages/reset-password/reset-password"),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "auth/login",
    pathMatch: "full",
  },
];
