"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && (savedLanguage === "es" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    console.log("[Language] Changing to:", lang);
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  };

  // Create t function that uses current language state
  const t = (key: keyof typeof translations.es): string => {
    const result = translations[language]?.[key];
    if (!result) {
      console.warn(`[Translation] Missing key: ${String(key)} for language: ${language}`);
      return String(key);
    }
    return result;
  };

  // During SSR/hydration, use Spanish defaults
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{
        language: "es",
        setLanguage: () => { },
        t: (key) => translations.es[key] || String(key)
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  console.log("[LanguageProvider] Rendering with language:", language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    console.error("[useLanguage] No LanguageContext found! Make sure LanguageProvider wraps the app.");
    return {
      language: "es",
      setLanguage: () => { },
      t: (key) => translations.es[key] || String(key),
    };
  }

  return context;
}
