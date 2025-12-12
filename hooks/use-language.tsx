"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, type Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.es) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    // Also dispatch event for any legacy components
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  const t = (key: keyof typeof translations.es): string => {
    return translations[language][key] || key;
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  // Fallback for components not wrapped in provider
  const [fallbackLanguage, setFallbackLanguage] = useState<Language>("es");

  useEffect(() => {
    if (!context) {
      const savedLanguage = localStorage.getItem("language") as Language | null;
      const initialLanguage = savedLanguage || "es";
      setFallbackLanguage(initialLanguage);

      const handleLanguageChange = (event: CustomEvent<Language>) => {
        setFallbackLanguage(event.detail);
      };

      window.addEventListener('languageChange', handleLanguageChange as EventListener);

      return () => {
        window.removeEventListener('languageChange', handleLanguageChange as EventListener);
      };
    }
  }, [context]);

  if (context) {
    return context;
  }

  const setLanguage = (lang: Language) => {
    setFallbackLanguage(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  const t = (key: keyof typeof translations.es): string => {
    return translations[fallbackLanguage][key] || key;
  };

  return { language: fallbackLanguage, setLanguage, t };
}
