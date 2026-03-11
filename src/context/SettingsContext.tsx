"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface SettingsContextType {
  theme: "light" | "dark";
  language: Language;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    const savedLanguage = (localStorage.getItem("language") as Language) || "en";

    setThemeState(savedTheme);
    setLanguageState(savedLanguage);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  const applyTheme = (themeValue: "light" | "dark") => {
    const html = document.documentElement;
    if (themeValue === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    // Return a default implementation if used outside provider
    // This helps with SSR and component rendering
    return {
      theme: "light" as const,
      language: "en" as const,
      setTheme: () => {},
      setLanguage: () => {},
      t: (key: TranslationKey): string => {
        return translations["en"][key] || key;
      },
    };
  }
  return context;
};
