'use client';

import Link from 'next/link';
import { SidebarNav } from "@/components/sidebar-nav";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/auth-context";
import { LayoutGrid, FileText, History } from "lucide-react";

// Import POS components following Dependency Inversion Principle
import { POSProvider, usePOS, TablesTab, OrdersTab, HistoryTab } from '@/components/pos';

// Tab configuration - Open/Closed: Add new tabs without modifying existing logic
const TABS = [
     { id: 'mesas', labelEs: 'Mesas', labelEn: 'Tables', icon: LayoutGrid },
     { id: 'comandas', labelEs: 'Comandas', labelEn: 'Orders', icon: FileText },
     { id: 'historial', labelEs: 'Registro', labelEn: 'History', icon: History },
] as const;

type TabId = typeof TABS[number]['id'];

// Inner component that uses the POS context
function POSContent() {
     const { t, language } = useLanguage();
     const { activeTab, setActiveTab } = usePOS();
     const { user, establishmentName } = useAuth();

     return (
          <div className="min-h-svh bg-background">
               <SidebarNav userName={user?.email || ''} establishmentName={establishmentName || 'Mi Bar'} />
               <nav className="border-b neumorphic-inset">
                    <div className="container mx-auto px-6 py-4">
                         <div className="flex items-center justify-between">
                              <Link href="/dashboard" className="block">
                                   <img
                                        src="/modoclaro.png"
                                        alt="Barmode"
                                        className="h-8 dark:hidden object-contain"
                                   />
                                   <img
                                        src="/modoscuro.png"
                                        alt="Barmode"
                                        className="h-8 hidden dark:block object-contain"
                                   />
                              </Link>
                         </div>
                    </div>
               </nav>

               <div className="min-h-screen bg-background p-6 ml-0 md:ml-20 lg:ml-72">
                    <div className="max-w-7xl mx-auto">
                         {/* Header */}
                         <div className="mb-6">
                              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                   {language === 'es' ? 'Punto de Venta' : 'Point of Sale'}
                              </h2>
                              <p className="text-muted-foreground">
                                   {language === 'es'
                                        ? 'Gestión de mesas, comandas y ventas'
                                        : 'Tables, orders and sales management'}
                              </p>
                         </div>

                         {/* Tabs */}
                         <div className="mb-6">
                              <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
                                   {TABS.map(tab => {
                                        const Icon = tab.icon;
                                        return (
                                             <button
                                                  key={tab.id}
                                                  type="button"
                                                  onClick={() => setActiveTab(tab.id)}
                                                  className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === tab.id
                                                       ? 'bg-background text-foreground shadow-sm font-medium'
                                                       : 'text-muted-foreground hover:text-foreground'
                                                       }`}
                                             >
                                                  <Icon className="w-4 h-4" />
                                                  {language === 'es' ? tab.labelEs : tab.labelEn}
                                             </button>
                                        );
                                   })}
                              </div>
                         </div>

                         {/* Tab Content - Single Responsibility: Just render the active tab */}
                         {activeTab === 'mesas' && <TablesTab />}
                         {activeTab === 'comandas' && <OrdersTab />}
                         {activeTab === 'historial' && <HistoryTab />}
                    </div>
               </div>
          </div>
     );
}

// Main page component - Wraps with Provider
export default function PuntoDeVentaPage() {
     return (
          <POSProvider>
               <POSContent />
          </POSProvider>
     );
}
