"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { translations, type Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.es) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get initial language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && (savedLanguage === "es" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: keyof typeof translations.es): string => {
    return translations[language][key] || String(key);
  }, [language]);

  // Avoid hydration mismatch - render children but with default Spanish
  if (!mounted) {
    const defaultT = (key: keyof typeof translations.es): string => {
      return translations.es[key] || String(key);
    };
    return (
      <LanguageContext.Provider value={{ language: "es", setLanguage: () => { }, t: defaultT }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    // This should never happen if LanguageProvider wraps the app
    console.warn("useLanguage must be used within a LanguageProvider");
    return {
      language: "es",
      setLanguage: () => { },
      t: (key) => translations.es[key] || String(key),
    };
  }

  return context;
}
