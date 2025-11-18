"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  useEffect(() => {
    // Check for saved language preference or default to Spanish
    const savedLanguage = localStorage.getItem("language") as "es" | "en" | null;
    const initialLanguage = savedLanguage || "es";
    setLanguage(initialLanguage);
    applyLanguage(initialLanguage);
  }, []);

  const applyLanguage = (newLanguage: "es" | "en") => {
    document.documentElement.lang = newLanguage;
    localStorage.setItem("language", newLanguage);
    // Dispatch custom event for language change
    window.dispatchEvent(new CustomEvent('languageChange', { detail: newLanguage }));
  };

  const toggleLanguage = () => {
    const newLanguage = language === "es" ? "en" : "es";
    setLanguage(newLanguage);
    applyLanguage(newLanguage);
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
