"use client";

import { ReactNode } from "react";

interface ContextBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ContextBoundary({ children, fallback }: ContextBoundaryProps) {
  try {
    return <>{children}</>;
  } catch (error) {
    if (error instanceof Error && error.message.includes("useSettings")) {
      console.warn("useSettings called outside SettingsProvider context", error);
      return <>{fallback || children}</>;
    }
    throw error;
  }
}
