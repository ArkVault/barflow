"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, Crown } from "lucide-react";
import { useState } from "react";
import { SubscriptionModal } from "./subscription-modal";

export function TrialBanner() {
     const { subscription, loading } = useSubscription();
     const [showModal, setShowModal] = useState(false);

     if (loading || !subscription.isTrialing) {
          return null;
     }

     const daysLeft = subscription.daysRemaining;
     const isExpiringSoon = daysLeft <= 7;

     return (
          <>
               <Card
                    className={`border-2 ${isExpiringSoon
                              ? 'border-orange-500/50 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20'
                              : 'border-purple-500/50 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20'
                         }`}
               >
                    <CardContent className="p-4">
                         <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg ${isExpiringSoon
                                             ? 'bg-orange-500/10'
                                             : 'bg-purple-500/10'
                                        }`}>
                                        {isExpiringSoon ? (
                                             <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-600' : 'text-purple-600'
                                                  }`} />
                                        ) : (
                                             <Sparkles className="w-5 h-5 text-purple-600" />
                                        )}
                                   </div>
                                   <div>
                                        <h3 className="font-semibold text-sm">
                                             {isExpiringSoon
                                                  ? `⚠️ Tu prueba gratuita termina en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`
                                                  : `✨ Tienes ${daysLeft} días restantes de prueba gratuita`
                                             }
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                             {isExpiringSoon
                                                  ? 'Suscríbete ahora para continuar disfrutando de todas las funcionalidades'
                                                  : 'Explora todas las funcionalidades sin límites'
                                             }
                                        </p>
                                   </div>
                              </div>

                              <Button
                                   onClick={() => setShowModal(true)}
                                   className={`shrink-0 ${isExpiringSoon
                                             ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                                             : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                                        } text-white border-0`}
                                   size="sm"
                              >
                                   <Crown className="w-4 h-4 mr-2" />
                                   {isExpiringSoon ? 'Suscribirse ahora' : 'Ver planes'}
                              </Button>
                         </div>
                    </CardContent>
               </Card>

               <SubscriptionModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    trialEnded={false}
               />
          </>
     );
}
