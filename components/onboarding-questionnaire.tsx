'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Set to true to always show the onboarding (for QA/testing)
const TEST_MODE = true;

// ─── Translations ────────────────────────────────────────────────────────────
const T = {
  es: {
    // SlideName
    nameTitle: '¿Cómo se llama tu establecimiento?',
    namePlaceholder: 'Ej. Bar El Jaguar',
    nameNext: 'Continuar',
    // SlideTeam
    teamTitle: '¿Quiénes forman tu equipo?',
    teamSubtitle: 'Indica cuántas personas hay en cada rol',
    teamRoles: [
      { key: 'meseros', label: 'Meseros' },
      { key: 'jefePiso', label: 'Jefe de piso / Manager' },
      { key: 'jefeBarra', label: 'Jefe de barra' },
      { key: 'admin', label: 'Admin' },
    ],
    teamNone: 'Ninguno',
    teamNext: 'Continuar',
    // SlideBranches
    branchTitle: '¿Cuántas sucursales tienes?',
    branchOne: 'Una sucursal',
    branchMany: 'Varias sucursales',
    branchCountLabel: 'Número de sucursales',
    branchCountPlaceholder: '2',
    branchPlanBadge: 'Plan seleccionado:',
    branchPlanBar: 'Bar Sucursal',
    branchPlanChain: 'Cadena Flowstock',
    branchNext: 'Continuar',
    // SlideInventory
    inventoryTitle: '¿Cómo quieres crear tu inventario?',
    inventoryExcel: 'Importar Excel',
    inventoryExcelDesc: 'Sube tu lista de insumos desde un archivo .xlsx',
    inventoryManual: 'Llenar manualmente después',
    inventoryManualDesc: 'Empieza con una lista vacía y llénala a tu ritmo',
    // SlideExcelUpload
    uploadTitle: 'Sube tu archivo de inventario',
    uploadDesc: 'Arrastra o selecciona un archivo .xlsx con tus insumos',
    uploadBtn: 'Seleccionar archivo',
    uploadNext: 'Importar y continuar',
    uploadLoading: 'Importando…',
    // SlidePayment
    paymentTitle: '¡Casi listo!',
    paymentSubtitle: 'Prueba Flowstock gratis durante 30 días',
    paymentDesc: 'Ingresa tu tarjeta para reservar tu lugar. No se realizará ningún cargo hasta el día 31.',
    paymentBtn: 'Iniciar prueba gratis',
    paymentLoading: 'Redirigiendo…',
    paymentFeatures: [
      'Sin cargo por 30 días',
      'Cancela cuando quieras',
      'Acceso completo desde el día 1',
    ],
    // Nav
    back: 'Regresar',
    skip: 'Omitir',
    progress: (n: number, total: number) => `${n} de ${total}`,
  },
  en: {
    nameTitle: "What's your establishment called?",
    namePlaceholder: 'e.g. The Jaguar Bar',
    nameNext: 'Continue',
    teamTitle: 'Who makes up your team?',
    teamSubtitle: 'Indicate how many people are in each role',
    teamRoles: [
      { key: 'meseros', label: 'Servers' },
      { key: 'jefePiso', label: 'Floor manager' },
      { key: 'jefeBarra', label: 'Bar manager' },
      { key: 'admin', label: 'Admin' },
    ],
    teamNone: 'None',
    teamNext: 'Continue',
    branchTitle: 'How many locations do you have?',
    branchOne: 'One location',
    branchMany: 'Multiple locations',
    branchCountLabel: 'Number of locations',
    branchCountPlaceholder: '2',
    branchPlanBadge: 'Selected plan:',
    branchPlanBar: 'Bar Location',
    branchPlanChain: 'Flowstock Chain',
    branchNext: 'Continue',
    inventoryTitle: 'How do you want to build your inventory?',
    inventoryExcel: 'Import Excel',
    inventoryExcelDesc: 'Upload your supply list from a .xlsx file',
    inventoryManual: 'Fill in manually later',
    inventoryManualDesc: 'Start with an empty list and fill it at your own pace',
    uploadTitle: 'Upload your inventory file',
    uploadDesc: 'Drag or select a .xlsx file with your supplies',
    uploadBtn: 'Select file',
    uploadNext: 'Import and continue',
    uploadLoading: 'Importing…',
    paymentTitle: 'Almost there!',
    paymentSubtitle: 'Try Flowstock free for 30 days',
    paymentDesc: 'Enter your card to reserve your spot. No charge until day 31.',
    paymentBtn: 'Start free trial',
    paymentLoading: 'Redirecting…',
    paymentFeatures: [
      'No charge for 30 days',
      'Cancel anytime',
      'Full access from day 1',
    ],
    back: 'Go back',
    skip: 'Skip',
    progress: (n: number, total: number) => `${n} of ${total}`,
  },
} as const;

type Lang = keyof typeof T;
type Translations = typeof T['es'];

// ─── Card & button shared styles ─────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'oklch(0.21 0.02 30)',
  border: '1px solid oklch(0.32 0.02 30)',
  boxShadow: '0 25px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  color: 'oklch(0.92 0.01 60)',
};

const btnGray =
  'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm ' +
  'bg-[oklch(0.32_0.02_30)] hover:bg-[oklch(0.36_0.02_30)] active:bg-[oklch(0.28_0.02_30)] ' +
  'text-[oklch(0.92_0.01_60)] border border-[oklch(0.40_0.02_30)] ' +
  'transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed';

const btnPrimary =
  'flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm ' +
  'bg-[oklch(0.65_0.14_220)] hover:bg-[oklch(0.70_0.14_220)] active:bg-[oklch(0.60_0.14_220)] ' +
  'text-white border border-[oklch(0.72_0.14_220)/40] ' +
  'transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed';

const inputStyle: React.CSSProperties = {
  background: 'oklch(0.17 0.02 30)',
  border: '1px solid oklch(0.32 0.02 30)',
  borderRadius: '0.75rem',
  color: 'oklch(0.92 0.01 60)',
  padding: '0.625rem 1rem',
  fontSize: '0.9375rem',
  width: '100%',
  outline: 'none',
};

// ─── Slide: Language ─────────────────────────────────────────────────────────
function SlideLang({ onSelect }: { onSelect: (l: Lang) => void }) {
  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="text-center">
        <p style={{ color: 'oklch(0.55 0.02 30)', fontSize: '0.8125rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Flowstock
        </p>
        <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3 }}>
          Elige tu idioma
          <br />
          <span style={{ color: 'oklch(0.65 0.02 60)', fontWeight: 400, fontSize: '1.125rem' }}>
            Choose your language
          </span>
        </h2>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onSelect('es')}
          className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl font-semibold text-base transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: 'oklch(0.26 0.02 30)',
            border: '1px solid oklch(0.38 0.02 30)',
            color: 'oklch(0.92 0.01 60)',
          }}
        >
          <span style={{ fontSize: '1rem', letterSpacing: '0.04em', color: 'oklch(0.55 0.02 30)' }}>ES</span>
          <span>Español</span>
        </button>
        <button
          onClick={() => onSelect('en')}
          className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl font-semibold text-base transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: 'oklch(0.26 0.02 30)',
            border: '1px solid oklch(0.38 0.02 30)',
            color: 'oklch(0.92 0.01 60)',
          }}
        >
          <span style={{ fontSize: '1rem', letterSpacing: '0.04em', color: 'oklch(0.55 0.02 30)' }}>EN</span>
          <span>English</span>
        </button>
      </div>
    </div>
  );
}

// ─── Slide: Name ─────────────────────────────────────────────────────────────
function SlideName({
  t, value, onChange, onNext, onBack,
}: { t: Translations; value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.25rem', fontWeight: 700 }}>
        {t.nameTitle}
      </h2>
      <input
        autoFocus
        style={inputStyle}
        placeholder={t.namePlaceholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && value.trim() && onNext()}
      />
      <div className="flex justify-between">
        <button className={btnGray} onClick={onBack}>← {t.back}</button>
        <button className={btnPrimary} disabled={!value.trim()} onClick={onNext}>
          {t.nameNext} →
        </button>
      </div>
    </div>
  );
}

// ─── Slide: Team ─────────────────────────────────────────────────────────────
type TeamCounts = Record<string, number>;

function SlideTeam({
  t, counts, onCount, onNext, onBack,
}: { t: Translations; counts: TeamCounts; onCount: (key: string, val: number) => void; onNext: () => void; onBack: () => void }) {
  const hasAny = Object.values(counts).some(v => v > 0);
  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.25rem', fontWeight: 700 }}>
          {t.teamTitle}
        </h2>
        <p style={{ color: 'oklch(0.55 0.02 30)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {t.teamSubtitle}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {t.teamRoles.map(({ key, label }) => {
          const val = counts[key] ?? 0;
          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'oklch(0.26 0.02 30)', border: '1px solid oklch(0.32 0.02 30)' }}
            >
              <span style={{ color: 'oklch(0.88 0.01 60)', fontSize: '0.9375rem', fontWeight: 500 }}>
                {label}
              </span>
              <select
                value={val}
                onChange={e => onCount(key, Number(e.target.value))}
                style={{
                  background: 'oklch(0.17 0.02 30)',
                  border: '1px solid oklch(0.38 0.02 30)',
                  borderRadius: '0.5rem',
                  color: val > 0 ? 'oklch(0.80 0.10 220)' : 'oklch(0.55 0.02 30)',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: '4.5rem',
                  outline: 'none',
                }}
              >
                <option value={0}>{t.teamNone}</option>
                {options.slice(1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button className={btnGray} onClick={onBack}>← {t.back}</button>
        <button className={btnPrimary} disabled={!hasAny} onClick={onNext}>
          {t.teamNext} →
        </button>
      </div>
    </div>
  );
}

// ─── Slide: Branches ─────────────────────────────────────────────────────────
function SlideBranches({
  t, mode, branchCount, onMode, onCount, onNext, onBack,
}: {
  t: Translations;
  mode: 'single' | 'multiple' | null;
  branchCount: string;
  onMode: (m: 'single' | 'multiple') => void;
  onCount: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canContinue = mode === 'single' || (mode === 'multiple' && Number(branchCount) >= 2);

  return (
    <div className="flex flex-col gap-6">
      <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.25rem', fontWeight: 700 }}>
        {t.branchTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {(['single', 'multiple'] as const).map(m => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => onMode(m)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors duration-150"
              style={{
                background: active ? 'oklch(0.65 0.14 220 / 0.15)' : 'oklch(0.26 0.02 30)',
                border: `1px solid ${active ? 'oklch(0.65 0.14 220 / 0.5)' : 'oklch(0.32 0.02 30)'}`,
                color: active ? 'oklch(0.80 0.10 220)' : 'oklch(0.75 0.01 60)',
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: active ? 'oklch(0.65 0.14 220)' : 'oklch(0.30 0.02 30)',
                border: `2px solid ${active ? 'oklch(0.65 0.14 220)' : 'oklch(0.40 0.02 30)'}`,
              }} />
              {m === 'single' ? t.branchOne : t.branchMany}
            </button>
          );
        })}
      </div>

      {mode === 'multiple' && (
        <div className="flex flex-col gap-1">
          <label style={{ color: 'oklch(0.65 0.02 60)', fontSize: '0.8125rem' }}>
            {t.branchCountLabel}
          </label>
          <input
            autoFocus
            type="number"
            min={2}
            style={inputStyle}
            placeholder={t.branchCountPlaceholder}
            value={branchCount}
            onChange={e => onCount(e.target.value)}
          />
        </div>
      )}

      {mode && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'oklch(0.65 0.14 220 / 0.10)', border: '1px solid oklch(0.65 0.14 220 / 0.25)', color: 'oklch(0.75 0.10 220)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          {t.branchPlanBadge} <strong>{mode === 'single' ? t.branchPlanBar : t.branchPlanChain}</strong>
        </div>
      )}

      <div className="flex justify-between">
        <button className={btnGray} onClick={onBack}>← {t.back}</button>
        <button className={btnPrimary} disabled={!canContinue} onClick={onNext}>
          {t.branchNext} →
        </button>
      </div>
    </div>
  );
}

// ─── Slide: Inventory method ──────────────────────────────────────────────────
function SlideInventory({
  t, onExcel, onManual, onBack,
}: { t: Translations; onExcel: () => void; onManual: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.25rem', fontWeight: 700 }}>
        {t.inventoryTitle}
      </h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={onExcel}
          className="flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-colors duration-150"
          style={{ background: 'oklch(0.26 0.02 30)', border: '1px solid oklch(0.38 0.02 30)', color: 'oklch(0.88 0.01 60)' }}
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📊</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.inventoryExcel}</p>
            <p style={{ color: 'oklch(0.55 0.02 30)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>{t.inventoryExcelDesc}</p>
          </div>
        </button>
        <button
          onClick={onManual}
          className="flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-colors duration-150"
          style={{ background: 'oklch(0.26 0.02 30)', border: '1px solid oklch(0.38 0.02 30)', color: 'oklch(0.88 0.01 60)' }}
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>✏️</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.inventoryManual}</p>
            <p style={{ color: 'oklch(0.55 0.02 30)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>{t.inventoryManualDesc}</p>
          </div>
        </button>
      </div>
      <div className="flex justify-start">
        <button className={btnGray} onClick={onBack}>← {t.back}</button>
      </div>
    </div>
  );
}

// ─── Slide: Excel upload ──────────────────────────────────────────────────────
function SlideExcelUpload({
  t, userId, onBack,
}: { t: Translations; userId: string; onBack: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: estData } = await supabase
        .from('establishments')
        .select('id')
        .eq('user_id', userId)
        .single();

      const establishmentId = estData?.id;
      if (!establishmentId) throw new Error('No establishment found');

      const form = new FormData();
      form.append('file', file);
      form.append('establishmentId', establishmentId);

      const res = await fetch('/api/menu/parse', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Parse failed');
      const { items } = await res.json();

      if (items?.length) {
        await supabase.from('supplies').insert(
          items.map((item: { name: string; unit?: string; cost?: number }) => ({
            establishment_id: establishmentId,
            name: item.name,
            unit: item.unit ?? 'unidad',
            cost_per_unit: item.cost ?? 0,
          }))
        );
      }

      await markOnboardingComplete(userId, supabase, { team_counts: teamCounts });
      router.push('/demo/insumos');
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.25rem', fontWeight: 700 }}>
        {t.uploadTitle}
      </h2>
      <p style={{ color: 'oklch(0.60 0.02 30)', fontSize: '0.875rem' }}>{t.uploadDesc}</p>
      <div
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl cursor-pointer transition-colors duration-150"
        style={{
          background: 'oklch(0.17 0.02 30)',
          border: `2px dashed ${file ? 'oklch(0.65 0.14 220 / 0.6)' : 'oklch(0.32 0.02 30)'}`,
          color: 'oklch(0.55 0.02 30)',
        }}
      >
        {/* Excel file icon */}
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Page body */}
          <rect x="1" y="1" width="30" height="38" rx="3" fill="oklch(0.17 0.02 30)" stroke={file ? 'oklch(0.65 0.14 220 / 0.6)' : 'oklch(0.36 0.02 30)'} strokeWidth="1.5"/>
          {/* Folded corner */}
          <path d="M24 1 L31 8 L24 8 Z" fill={file ? 'oklch(0.55 0.12 220 / 0.35)' : 'oklch(0.28 0.02 30)'} stroke={file ? 'oklch(0.65 0.14 220 / 0.6)' : 'oklch(0.36 0.02 30)'} strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Green XLS badge */}
          <rect x="16" y="30" width="22" height="14" rx="3" fill="oklch(0.48 0.16 145)"/>
          <text x="27" y="41" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif">XLS</text>
          {/* Spreadsheet lines */}
          <line x1="7" y1="14" x2="24" y2="14" stroke={file ? 'oklch(0.65 0.14 220 / 0.5)' : 'oklch(0.34 0.02 30)'} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="7" y1="19" x2="24" y2="19" stroke={file ? 'oklch(0.65 0.14 220 / 0.5)' : 'oklch(0.34 0.02 30)'} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="7" y1="24" x2="18" y2="24" stroke={file ? 'oklch(0.65 0.14 220 / 0.5)' : 'oklch(0.34 0.02 30)'} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {file ? file.name : t.uploadBtn}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="flex justify-between">
        <button className={btnGray} onClick={onBack} disabled={loading}>← {t.back}</button>
        <button className={btnPrimary} disabled={!file || loading} onClick={handleImport}>
          {loading ? t.uploadLoading : `${t.uploadNext} →`}
        </button>
      </div>
    </div>
  );
}

// ─── Slide: Payment / trial ───────────────────────────────────────────────────
function SlidePayment({
  t, userId, userEmail, priceId, onBack,
}: { t: Translations; userId: string; userEmail: string; priceId: string; onBack: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId, userEmail }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 style={{ color: 'oklch(0.92 0.01 60)', fontSize: '1.375rem', fontWeight: 700 }}>
          {t.paymentTitle}
        </h2>
        <p style={{ color: 'oklch(0.65 0.14 220)', fontWeight: 600, marginTop: '0.25rem' }}>
          {t.paymentSubtitle}
        </p>
      </div>
      <p style={{ color: 'oklch(0.60 0.02 30)', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {t.paymentDesc}
      </p>
      <ul className="flex flex-col gap-2">
        {t.paymentFeatures.map(f => (
          <li key={f} className="flex items-center gap-2" style={{ color: 'oklch(0.78 0.04 160)', fontSize: '0.875rem' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="oklch(0.55 0.14 160 / 0.25)" stroke="oklch(0.65 0.14 160)" strokeWidth="1.2"/><path d="M4 7l2 2 4-4" stroke="oklch(0.75 0.14 160)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {f}
          </li>
        ))}
      </ul>
      <div className="flex justify-between">
        <button className={btnGray} onClick={onBack} disabled={loading}>← {t.back}</button>
        <button className={btnPrimary} disabled={loading} onClick={handleCheckout}>
          {loading ? t.paymentLoading : t.paymentBtn}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function markOnboardingComplete(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  extra?: Record<string, unknown>
) {
  await supabase.auth.updateUser({
    data: { onboarding_complete: true, ...extra },
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export function OnboardingQuestionnaire({
  userId,
  userEmail = '',
}: {
  userId: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<Lang>('es');
  const [slide, setSlide] = useState(0); // 0 = lang, 1-5 = questions
  const [mounted, setMounted] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [teamCounts, setTeamCounts] = useState<TeamCounts>({});
  const [branchMode, setBranchMode] = useState<'single' | 'multiple' | null>(null);
  const [branchCount, setBranchCount] = useState('');
  const [inventoryChoice, setInventoryChoice] = useState<'excel' | 'manual' | null>(null);

  const TOTAL = 5;

  // Resolve price ID based on branch selection
  const priceId =
    branchMode === 'multiple'
      ? process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID ?? ''
      : process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID ?? '';

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Lang | null;
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) setLang(savedLang);

    if (TEST_MODE) {
      setVisible(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const complete = data?.user?.user_metadata?.onboarding_complete;
      if (!complete) setVisible(true);
    });
  }, []);

  // Animate in
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    }
  }, [visible]);

  if (!visible) return null;

  const t = T[lang];

  const handleLangSelect = (l: Lang) => {
    setLang(l);
    localStorage.setItem('language', l);
    setSlide(1);
  };

  const handleManual = async () => {
    const supabase = createClient();
    await markOnboardingComplete(userId, supabase, { team_counts: teamCounts });
    setInventoryChoice('manual');
    setSlide(5);
  };

  const progressPercent = slide > 0 ? ((slide - 1) / (TOTAL - 1)) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — no dark class, just blur */}
      <div className="absolute inset-0 backdrop-blur-xl bg-black/25" />

      {/* Card — forced dark with literal oklch values */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 transition-all duration-500"
        style={{
          ...cardStyle,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        }}
      >
        {/* Progress bar (slides 1-5 only) */}
        {slide > 0 && (
          <div className="mb-6">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: 'oklch(0.50 0.02 30)', fontSize: '0.75rem' }}>
                {t.progress(slide, TOTAL)}
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, background: 'oklch(0.28 0.02 30)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, background: 'oklch(0.65 0.14 220)' }}
              />
            </div>
          </div>
        )}

        {/* Slides */}
        {slide === 0 && <SlideLang onSelect={handleLangSelect} />}

        {slide === 1 && (
          <SlideName
            t={t}
            value={name}
            onChange={setName}
            onNext={() => setSlide(2)}
            onBack={() => setSlide(0)}
          />
        )}

        {slide === 2 && (
          <SlideTeam
            t={t}
            counts={teamCounts}
            onCount={(key, val) => setTeamCounts(prev => ({ ...prev, [key]: val }))}
            onNext={() => setSlide(3)}
            onBack={() => setSlide(1)}
          />
        )}

        {slide === 3 && (
          <SlideBranches
            t={t}
            mode={branchMode}
            branchCount={branchCount}
            onMode={setBranchMode}
            onCount={setBranchCount}
            onNext={() => setSlide(4)}
            onBack={() => setSlide(2)}
          />
        )}

        {slide === 4 && (
          <SlideInventory
            t={t}
            onExcel={() => { setInventoryChoice('excel'); setSlide(5); }}
            onManual={handleManual}
            onBack={() => setSlide(3)}
          />
        )}

        {slide === 5 && inventoryChoice === 'excel' && (
          <SlideExcelUpload
            t={t}
            userId={userId}
            onBack={() => setSlide(4)}
          />
        )}

        {slide === 5 && inventoryChoice === 'manual' && (
          <SlidePayment
            t={t}
            userId={userId}
            userEmail={userEmail}
            priceId={priceId}
            onBack={() => setSlide(4)}
          />
        )}
      </div>
    </div>
  );
}
