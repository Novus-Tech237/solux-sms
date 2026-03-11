"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "react-toastify";

const SettingsPage = () => {
  const { theme, language, setTheme, setLanguage, t } = useSettings();
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocalTheme(theme);
    setLocalLanguage(language);
  }, [theme, language]);

  const handleSave = () => {
    setTheme(localTheme);
    setLanguage(localLanguage);
    toast.success(t("saved"), {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const handleReset = () => {
    setLocalTheme(theme);
    setLocalLanguage(language);
  };

  if (!mounted) {
    return <div className="p-4 md:p-8">{t("loading")}</div>;
  }

  return (
    <div className="p-4 md:p-8 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          {t("settings")}
        </h1>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              {t("theme")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-3 border-2 border-transparent rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={localTheme === "light"}
                  onChange={(e) => setLocalTheme(e.target.value as "light")}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">{t("light")}</span>
                <span className="text-2xl">☀️</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-3 border-2 border-transparent rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={localTheme === "dark"}
                  onChange={(e) => setLocalTheme(e.target.value as "dark")}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">{t("dark")}</span>
                <span className="text-2xl">🌙</span>
              </label>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              {t("language")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-3 border-2 border-transparent rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={localLanguage === "en"}
                  onChange={(e) => setLocalLanguage(e.target.value as "en")}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">{t("english")}</span>
                <span className="text-2xl">🇬🇧</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-3 border-2 border-transparent rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition">
                <input
                  type="radio"
                  name="language"
                  value="fr"
                  checked={localLanguage === "fr"}
                  onChange={(e) => setLocalLanguage(e.target.value as "fr")}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">{t("french")}</span>
                <span className="text-2xl">🇫🇷</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {t("save")}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
