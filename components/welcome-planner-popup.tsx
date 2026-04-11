"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

/** localStorage keys */
const KEY_COUNT = "planner_hint_count"; // number of sessions shown (0–3)
const KEY_METHOD = "inventory_method"; // "manual" | "excel"
const MAX_SESSIONS = 3;

const T = {
  es: {
    eyebrow: "Por dónde empezar",
    title: "Tu inventario está esperando",
    body: "Como decidiste llenar tu lista manualmente, te recomendamos comenzar por el Planner — ahí puedes definir todos tus insumos y cantidades.",
    cta: "Ir al Planner",
    dismiss: "Después",
  },
  en: {
    eyebrow: "Where to start",
    title: "Your inventory is waiting",
    body: "Since you chose to fill your list manually, we recommend starting with the Planner — that's where you can define all your supplies and quantities.",
    cta: "Go to Planner",
    dismiss: "Later",
  },
};

interface WelcomePlannerPopupProps {
  plannerHref: string;
  /**
   * In demo mode we simulate "manual" choice — the popup shows up to MAX_SESSIONS times.
   * In production, pass false and rely on localStorage KEY_METHOD set by the onboarding.
   */
  demoMode?: boolean;
}

export function WelcomePlannerPopup({
  plannerHref,
  demoMode = false,
}: WelcomePlannerPopupProps) {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [targetY, setTargetY] = useState<number | null>(null);

  const t = T[(language as keyof typeof T) ?? "es"] ?? T.es;

  useEffect(() => {
    // Gate 1: only show when user chose manual inventory (or demo forces it)
    const method = localStorage.getItem(KEY_METHOD);
    if (!demoMode && method !== "manual") return;

    // Gate 2: only show for the first MAX_SESSIONS sessions
    const count = parseInt(localStorage.getItem(KEY_COUNT) ?? "0", 10);
    if (count >= MAX_SESSIONS) return;

    // Gate 3: show at most once per browser session (sessionStorage flag)
    if (sessionStorage.getItem("planner_hint_shown_this_session")) return;

    // Wait a beat so the onboarding can close first
    const timer = setTimeout(() => {
      const plannerEl = document.querySelector<HTMLElement>(
        '[data-tour="planner-link"]',
      );
      if (plannerEl) {
        const rect = plannerEl.getBoundingClientRect();
        setTargetY(rect.top + rect.height / 2);
        plannerEl.setAttribute("data-tour-active", "true");
      }

      // Increment session count and mark this session as shown
      localStorage.setItem(KEY_COUNT, String(count + 1));
      sessionStorage.setItem("planner_hint_shown_this_session", "1");

      setVisible(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setEntered(true)),
      );
    }, 900);

    return () => clearTimeout(timer);
  }, [demoMode]);

  const handleDismiss = () => {
    const plannerEl = document.querySelector<HTMLElement>(
      '[data-tour="planner-link"]',
    );
    plannerEl?.removeAttribute("data-tour-active");
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  // Sidebar occupies: left-4 (16px) + w-72 (288px) = 304px. Card starts after a gap.
  const SIDEBAR_WIDTH = 304;
  const CARD_GAP = 16;
  const CARD_WIDTH = 272;
  const cardLeft = SIDEBAR_WIDTH + CARD_GAP;
  const cardTopRaw =
    targetY ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 400);

  return (
    <>
      {/* Pulse ring injected on the sidebar item via CSS data attribute */}
      <style>{`
        [data-tour-active="true"] {
          position: relative;
        }
        [data-tour-active="true"]::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 1rem;
          border: 2px solid oklch(0.65 0.18 260 / 0.7);
          animation: planner-ring 1.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes planner-ring {
          0%, 100% { opacity: 0.9; box-shadow: 0 0 0 0 oklch(0.65 0.18 260 / 0.4); }
          50%       { opacity: 0.5; box-shadow: 0 0 0 6px oklch(0.65 0.18 260 / 0); }
        }
      `}</style>

      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Floating card */}
        <div
          className="absolute pointer-events-auto"
          style={{
            left: cardLeft,
            top: cardTopRaw,
            transform: `translateY(-50%) translateX(${entered ? "0px" : "-12px"})`,
            opacity: entered ? 1 : 0,
            transition:
              "opacity 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)",
            width: CARD_WIDTH,
          }}
        >
          {/* Arrow pointing left toward the Planner item */}
          <div
            className="absolute"
            style={{
              left: -8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderRight: "9px solid oklch(0.28 0.04 260)",
              filter: "drop-shadow(-2px 0 4px rgba(0,0,0,0.3))",
            }}
          />

          {/* Card body */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.24 0.03 260) 0%, oklch(0.20 0.02 30) 100%)",
              border: "1px solid oklch(0.35 0.06 260 / 0.6)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px oklch(0.45 0.08 260 / 0.2) inset",
            }}
          >
            {/* Subtle top glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.65 0.18 260 / 0.5), transparent)",
              }}
            />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg transition-opacity opacity-50 hover:opacity-100"
              style={{ color: "oklch(0.65 0.02 30)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "oklch(0.55 0.18 260 / 0.15)",
                border: "1px solid oklch(0.55 0.18 260 / 0.35)",
              }}
            >
              <ClipboardList
                className="w-[18px] h-[18px]"
                style={{ color: "oklch(0.78 0.14 260)" }}
              />
            </div>

            {/* Eyebrow */}
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.65 0.14 260)" }}
            >
              {t.eyebrow}
            </p>

            {/* Title */}
            <h3
              className="font-bold text-sm mb-2 leading-snug"
              style={{ color: "oklch(0.93 0.01 60)" }}
            >
              {t.title}
            </h3>

            {/* Body */}
            <p
              className="text-xs leading-relaxed mb-4"
              style={{ color: "oklch(0.62 0.02 30)" }}
            >
              {t.body}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={plannerHref}
                onClick={handleDismiss}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:brightness-110 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.18 260), oklch(0.48 0.16 280))",
                  color: "white",
                  boxShadow: "0 4px 14px oklch(0.55 0.18 260 / 0.35)",
                }}
              >
                {t.cta}
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs transition-colors duration-150 hover:brightness-110"
                style={{
                  background: "oklch(0.28 0.02 30)",
                  color: "oklch(0.58 0.02 30)",
                  border: "1px solid oklch(0.34 0.02 30)",
                }}
              >
                {t.dismiss}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
