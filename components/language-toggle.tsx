"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage = language === "es" ? "en" : "es";
    if (setLanguage) {
      setLanguage(newLanguage);
    } else {
      // Fallback for when not in provider
      localStorage.setItem("language", newLanguage);
      document.documentElement.lang = newLanguage;
      window.dispatchEvent(new CustomEvent('languageChange', { detail: newLanguage }));
      window.location.reload(); // Force reload if no provider
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className="neumorphic-hover border-0"
      title={language === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className="text-sm font-semibold">
        {language === "es" ? "EN" : "ES"}
      </span>
    </Button>
  );
}
