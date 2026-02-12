'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
     X,
     Send,
     Mail,
     Phone,
     User,
     Building2,
     Zap,
     MessageSquare,
} from 'lucide-react';
import type { QuoteFormData } from './use-account-profile';

interface QuoteModalProps {
     show: boolean;
     onClose: () => void;
     quoteForm: QuoteFormData;
     setQuoteForm: React.Dispatch<React.SetStateAction<QuoteFormData>>;
     isSendingQuote: boolean;
     handleSendQuote: () => void;
     language: string;
}

export function QuoteModal({
     show,
     onClose,
     quoteForm,
     setQuoteForm,
     isSendingQuote,
     handleSendQuote,
     language,
}: QuoteModalProps) {
     if (!show) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="neumorphic rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                         <div>
                              <h3 className="text-xl font-bold">
                                   {language === 'es' ? 'Solicitar Cotización' : 'Request Quote'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                   {language === 'es' ? 'Plan Cadena - Múltiples sucursales' : 'Chain Plan - Multiple branches'}
                              </p>
                         </div>
                         <button
                              onClick={onClose}
                              className="p-2 rounded-full hover:bg-muted transition-colors"
                         >
                              <X className="h-5 w-5" />
                         </button>
                    </div>

                    <div className="space-y-4">
                         <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                   <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {language === 'es' ? 'Nombre *' : 'Name *'}
                                   </Label>
                                   <Input
                                        value={quoteForm.name}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                                        placeholder={language === 'es' ? 'Tu nombre completo' : 'Your full name'}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {language === 'es' ? 'Email *' : 'Email *'}
                                   </Label>
                                   <Input
                                        type="email"
                                        value={quoteForm.email}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                                        placeholder="tu@email.com"
                                   />
                              </div>
                         </div>

                         <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                   <Label className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {language === 'es' ? 'Teléfono *' : 'Phone *'}
                                   </Label>
                                   <Input
                                        value={quoteForm.phone}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                                        placeholder="+52 555 123 4567"
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {language === 'es' ? 'Nombre del negocio' : 'Business name'}
                                   </Label>
                                   <Input
                                        value={quoteForm.businessName}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, businessName: e.target.value })}
                                        placeholder={language === 'es' ? 'Mi Bar/Restaurante' : 'My Bar/Restaurant'}
                                   />
                              </div>
                         </div>

                         <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                   <Zap className="h-4 w-4 text-muted-foreground" />
                                   {language === 'es' ? '¿Cuántas sucursales necesitas? *' : 'How many branches do you need? *'}
                              </Label>
                              <Input
                                   value={quoteForm.branches}
                                   onChange={(e) => setQuoteForm({ ...quoteForm, branches: e.target.value })}
                                   placeholder={language === 'es' ? 'Ej: 3 sucursales actuales, planeamos 5 más' : 'E.g: 3 current branches, planning 5 more'}
                              />
                         </div>

                         <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                   <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                   {language === 'es' ? 'Mensaje adicional (opcional)' : 'Additional message (optional)'}
                              </Label>
                              <Textarea
                                   value={quoteForm.message}
                                   onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                                   placeholder={language === 'es'
                                        ? 'Cuéntanos más sobre tu negocio y necesidades...'
                                        : 'Tell us more about your business and needs...'}
                                   rows={3}
                              />
                         </div>

                         <div className="flex gap-3 pt-4">
                              <Button
                                   variant="ghost"
                                   onClick={onClose}
                                   className="flex-1"
                              >
                                   {language === 'es' ? 'Cancelar' : 'Cancel'}
                              </Button>
                              <Button
                                   onClick={handleSendQuote}
                                   disabled={isSendingQuote}
                                   className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              >
                                   {isSendingQuote ? (
                                        <span className="flex items-center gap-2">
                                             <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                             {language === 'es' ? 'Enviando...' : 'Sending...'}
                                        </span>
                                   ) : (
                                        <>
                                             <Send className="mr-2 h-4 w-4" />
                                             {language === 'es' ? 'Enviar Solicitud' : 'Send Request'}
                                        </>
                                   )}
                              </Button>
                         </div>
                    </div>
               </div>
          </div>
     );
}
