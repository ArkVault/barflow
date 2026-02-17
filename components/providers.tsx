"use client";

import { LanguageProvider } from "@/hooks/use-language";

export function Providers({ children }: { children: React.ReactNode }) {
     return <LanguageProvider>{children}</LanguageProvider>;
}
