'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Plug } from 'lucide-react';

interface ConnectionsTabProps {
     openTableConnected: boolean;
     openTableRestaurantName: string;
     language: string;
}

export function ConnectionsTab({
     openTableConnected,
     openTableRestaurantName,
     language,
}: ConnectionsTabProps) {
     return (
          <div className="space-y-8">
               <div className="neumorphic rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 rounded-full bg-orange-500/10">
                              <Plug className="h-5 w-5 text-orange-500" />
                         </div>
                         <div>
                              <h3 className="text-lg font-semibold">
                                   {language === 'es' ? 'Integraciones' : 'Integrations'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                   {language === 'es'
                                        ? 'Conecta servicios externos para automatizar tu negocio'
                                        : 'Connect external services to automate your business'}
                              </p>
                         </div>
                    </div>

                    {/* OpenTable Integration Card */}
                    <div className="border border-border rounded-xl p-6 space-y-4 hover:border-orange-500/50 transition-colors">
                         <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                   <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                                        <img
                                             src="/opentable-icon.png"
                                             alt="OpenTable"
                                             className="w-full h-full object-cover"
                                        />
                                   </div>
                                   <div>
                                        <h4 className="text-lg font-semibold">OpenTable</h4>
                                        <p className="text-sm text-muted-foreground">
                                             {language === 'es'
                                                  ? 'Sincroniza reservaciones automáticamente'
                                                  : 'Sync reservations automatically'}
                                        </p>
                                   </div>
                              </div>

                              {/* Connection Status Badge */}
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${openTableConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                                   <span className={`w-2 h-2 rounded-full ${openTableConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                   <span className={`text-xs font-medium ${openTableConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                        {openTableConnected
                                             ? (language === 'es' ? 'Conectado' : 'Connected')
                                             : (language === 'es' ? 'No conectado' : 'Not connected')}
                                   </span>
                              </div>
                         </div>

                         {openTableConnected && openTableRestaurantName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <CheckCircle className="h-4 w-4 text-green-500" />
                                   <span>{openTableRestaurantName}</span>
                              </div>
                         )}

                         <p className="text-sm text-muted-foreground">
                              {language === 'es'
                                   ? 'Conecta tu cuenta de OpenTable para que las reservaciones se reflejen automáticamente en tus mesas del Punto de Venta.'
                                   : 'Connect your OpenTable account so reservations automatically reflect on your POS tables.'}
                         </p>

                         <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border border-border">
                                   <img
                                        src="/opentable-icon.png"
                                        alt="OpenTable"
                                        className="w-5 h-5 opacity-50"
                                   />
                                   <span className="text-muted-foreground font-medium">
                                        {language === 'es' ? 'Conexión Automática' : 'Auto Connection'}
                                   </span>
                                   <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                                        {language === 'es' ? 'Próximamente' : 'Coming Soon'}
                                   </Badge>
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                   {language === 'es'
                                        ? 'Mientras tanto, puedes crear reservaciones manuales desde la pestaña "Mesas" en el Punto de Venta'
                                        : 'Meanwhile, you can create manual reservations from the "Tables" tab in the Point of Sale'}
                              </p>
                         </div>

                         {/* Features List */}
                         <div className="pt-4 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-3">
                                   {language === 'es' ? 'Características:' : 'Features:'}
                              </p>
                              <ul className="space-y-2">
                                   {[
                                        language === 'es' ? 'Sincronización en tiempo real' : 'Real-time synchronization',
                                        language === 'es' ? 'Actualización automática de estado de mesas' : 'Automatic table status updates',
                                        language === 'es' ? 'Detalles de cliente y reservación' : 'Customer and reservation details',
                                        language === 'es' ? 'Notificaciones de cambios' : 'Change notifications',
                                   ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                             <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                             {feature}
                                        </li>
                                   ))}
                              </ul>
                         </div>
                    </div>

                    {/* Coming Soon Integrations */}
                    <div className="border border-dashed border-border rounded-xl p-6 text-center space-y-3 opacity-60">
                         <div className="flex items-center justify-center gap-2">
                              <Sparkles className="h-5 w-5 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">
                                   {language === 'es' ? 'Más integraciones próximamente' : 'More integrations coming soon'}
                              </p>
                         </div>
                    </div>
               </div>
          </div>
     );
}
