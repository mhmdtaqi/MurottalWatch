import { Outlet, Navigate } from "react-router";
import React from "react";

// Simple in-memory auth check — replace with real auth later
export function isAuthenticated(): boolean {
  return sessionStorage.getItem("auth") === "true";
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function Root() {
  return <Outlet />;
}
