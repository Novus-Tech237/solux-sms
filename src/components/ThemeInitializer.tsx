"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    // Apply saved theme and language on initial load
    const savedTheme = localStorage.getItem("theme") || "light";
    const html = document.documentElement;
    
    if (savedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, []);

  return null;
}
