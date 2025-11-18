"use client";

import { useEffect, useState } from "react";
import { translations, type Language } from "@/lib/translations";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    // Get initial language
    const savedLanguage = localStorage.getItem("language") as Language | null;
    const initialLanguage = savedLanguage || "es";
    setLanguage(initialLanguage);

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const t = (key: keyof typeof translations.es): string => {
    return translations[language][key] || key;
  };

  return { language, t };
}
