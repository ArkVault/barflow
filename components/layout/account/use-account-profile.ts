'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { useLanguage } from '@/hooks/use-language';
import { toast } from 'sonner';

export interface UserProfile {
     email: string;
     full_name: string;
     establishment_name: string;
     phone: string;
}

export interface QuoteFormData {
     name: string;
     email: string;
     phone: string;
     businessName: string;
     branches: string;
     message: string;
}

export function useAccountProfile() {
     const { user, establishmentId } = useAuth();
     const { subscription } = useSubscription();
     const { language } = useLanguage();

     const [profile, setProfile] = useState<UserProfile>({
          email: '',
          full_name: '',
          establishment_name: '',
          phone: '',
     });
     const [isEditing, setIsEditing] = useState(false);
     const [isSaving, setIsSaving] = useState(false);
     const [isUpgrading, setIsUpgrading] = useState(false);
     const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
     const [showQuoteModal, setShowQuoteModal] = useState(false);
     const [isSendingQuote, setIsSendingQuote] = useState(false);

     // Quote form state
     const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
          name: '',
          email: '',
          phone: '',
          businessName: '',
          branches: '',
          message: '',
     });

     // Password change state
     const [passwords, setPasswords] = useState({
          current: '',
          new: '',
          confirm: '',
     });
     const [showPasswords, setShowPasswords] = useState({
          current: false,
          new: false,
          confirm: false,
     });
     const [isChangingPassword, setIsChangingPassword] = useState(false);

     // OpenTable integration state
     const [openTableConnected, setOpenTableConnected] = useState(false);
     const [isConnectingOpenTable, setIsConnectingOpenTable] = useState(false);
     const [openTableRestaurantName, setOpenTableRestaurantName] = useState('');

     useEffect(() => {
          if (user && establishmentId) {
               fetchProfile();
          }
     }, [user, establishmentId]);

     // Pre-fill quote form with profile data
     useEffect(() => {
          if (profile.email || profile.full_name) {
               setQuoteForm(prev => ({
                    ...prev,
                    name: profile.full_name || prev.name,
                    email: profile.email || prev.email,
                    phone: profile.phone || prev.phone,
                    businessName: profile.establishment_name || prev.businessName,
               }));
          }
     }, [profile]);

     const fetchProfile = async () => {
          const supabase = createClient();
          const { data: establishment } = await supabase
               .from('establishments')
               .select('name, phone')
               .eq('id', establishmentId)
               .single();

          const { data: { user: authUser } } = await supabase.auth.getUser();

          setProfile({
               email: authUser?.email || '',
               full_name: authUser?.user_metadata?.full_name || '',
               establishment_name: establishment?.name || '',
               phone: establishment?.phone || '',
          });

          // Check OpenTable integration status
          const { data: integration } = await supabase
               .from('opentable_integrations')
               .select('is_active, opentable_restaurant_name')
               .eq('establishment_id', establishmentId)
               .single();

          if (integration?.is_active) {
               setOpenTableConnected(true);
               setOpenTableRestaurantName(integration.opentable_restaurant_name || '');
          }
     };

     const handleSaveProfile = async () => {
          setIsSaving(true);
          try {
               const supabase = createClient();
               const { error: estError } = await supabase
                    .from('establishments')
                    .update({
                         name: profile.establishment_name,
                         phone: profile.phone,
                    })
                    .eq('id', establishmentId);

               if (estError) throw estError;

               const { error: userError } = await supabase.auth.updateUser({
                    data: { full_name: profile.full_name },
               });

               if (userError) throw userError;
               toast.success(language === 'es' ? 'Perfil actualizado correctamente' : 'Profile updated successfully');
               setIsEditing(false);
          } catch (error) {
               console.error('Error updating profile:', error);
               toast.error(language === 'es' ? 'Error al actualizar el perfil' : 'Error updating profile');
          } finally {
               setIsSaving(false);
          }
     };

     const handleChangePassword = async () => {
          if (passwords.new !== passwords.confirm) {
               toast.error(language === 'es' ? 'Las contraseñas no coinciden' : "Passwords don't match");
               return;
          }
          if (passwords.new.length < 6) {
               toast.error(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
               return;
          }

          setIsChangingPassword(true);
          try {
               const supabase = createClient();
               const { error } = await supabase.auth.updateUser({
                    password: passwords.new,
               });

               if (error) throw error;

               toast.success(language === 'es' ? 'Contraseña actualizada correctamente' : 'Password updated successfully');
               setPasswords({ current: '', new: '', confirm: '' });
          } catch (error: any) {
               console.error('Error changing password:', error);
               toast.error(error.message || (language === 'es' ? 'Error al cambiar la contraseña' : 'Error changing password'));
          } finally {
               setIsChangingPassword(false);
          }
     };

     const handleSendQuote = async () => {
          if (!quoteForm.name || !quoteForm.email || !quoteForm.phone || !quoteForm.branches) {
               toast.error(language === 'es' ? 'Por favor completa todos los campos requeridos' : 'Please fill in all required fields');
               return;
          }

          setIsSendingQuote(true);
          try {
               const response = await fetch('/api/send-quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quoteForm),
               });

               const data = await response.json();

               if (!response.ok) {
                    throw new Error(data.error || 'Failed to send quote');
               }

               toast.success(
                    language === 'es'
                         ? '¡Solicitud enviada! Te contactaremos pronto.'
                         : "Request sent! We'll contact you soon."
               );
               setShowQuoteModal(false);
               setQuoteForm({
                    name: profile.full_name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    businessName: profile.establishment_name || '',
                    branches: '',
                    message: '',
               });
          } catch (error) {
               console.error('Error sending quote:', error);
               toast.error(language === 'es' ? 'Error al enviar la solicitud' : 'Error sending request');
          } finally {
               setIsSendingQuote(false);
          }
     };

     const handleConnectOpenTable = async () => {
          setIsConnectingOpenTable(true);
          try {
               const supabase = createClient();
               const demoRestaurantName = profile.establishment_name || 'Mi Restaurante';

               const { error } = await supabase
                    .from('opentable_integrations')
                    .upsert({
                         establishment_id: establishmentId,
                         access_token: 'demo_token_encrypted',
                         refresh_token: 'demo_refresh_encrypted',
                         token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                         opentable_restaurant_id: 'demo_restaurant_id',
                         opentable_restaurant_name: demoRestaurantName,
                         webhook_id: 'demo_webhook_id',
                         webhook_secret: 'demo_secret',
                         is_active: true,
                    }, {
                         onConflict: 'establishment_id'
                    });

               if (error) throw error;

               setOpenTableConnected(true);
               setOpenTableRestaurantName(demoRestaurantName);
               toast.success(
                    language === 'es'
                         ? '¡OpenTable conectado exitosamente! (Modo Demo)'
                         : 'OpenTable connected successfully! (Demo Mode)'
               );
          } catch (error) {
               console.error('Error connecting OpenTable:', error);
               toast.error(
                    language === 'es'
                         ? 'Error al conectar OpenTable'
                         : 'Error connecting OpenTable'
               );
          } finally {
               setIsConnectingOpenTable(false);
          }
     };

     const handleDisconnectOpenTable = async () => {
          try {
               const supabase = createClient();
               const { error } = await supabase
                    .from('opentable_integrations')
                    .update({ is_active: false })
                    .eq('establishment_id', establishmentId);

               if (error) throw error;

               setOpenTableConnected(false);
               setOpenTableRestaurantName('');
               toast.success(
                    language === 'es'
                         ? 'OpenTable desconectado'
                         : 'OpenTable disconnected'
               );
          } catch (error) {
               console.error('Error disconnecting OpenTable:', error);
               toast.error(
                    language === 'es'
                         ? 'Error al desconectar'
                         : 'Error disconnecting'
               );
          }
     };

     const handleUpgrade = async (priceId: string) => {
          setIsUpgrading(true);
          try {
               const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                         priceId,
                         userId: user?.id,
                         userEmail: profile.email,
                         establishmentId,
                         successUrl: `${window.location.origin}/dashboard/cuenta?success=true`,
                         cancelUrl: `${window.location.origin}/dashboard/cuenta?canceled=true`,
                    }),
               });

               const data = await response.json();
               if (data.error) {
                    toast.error(data.error);
                    return;
               }

               if (data.url) {
                    window.location.href = data.url;
               } else {
                    toast.error(language === 'es' ? 'Error al crear la sesión de pago' : 'Error creating payment session');
               }
          } catch (error) {
               console.error('Error creating checkout session:', error);
               toast.error(language === 'es' ? 'Error al procesar el upgrade' : 'Error processing upgrade');
          } finally {
               setIsUpgrading(false);
          }
     };

     const getPlanName = () => {
          switch (subscription.planType) {
               case 'chain': return language === 'es' ? 'Plan Cadena' : 'Chain Plan';
               case 'bar_yearly': return language === 'es' ? '1 Bar (Anual)' : '1 Bar (Yearly)';
               case 'bar_monthly': return language === 'es' ? '1 Bar (Mensual)' : '1 Bar (Monthly)';
               default: return language === 'es' ? 'Trial Gratuito' : 'Free Trial';
          }
     };

     return {
          // Profile
          profile,
          setProfile,
          isEditing,
          setIsEditing,
          isSaving,
          handleSaveProfile,

          // Password
          passwords,
          setPasswords,
          showPasswords,
          setShowPasswords,
          isChangingPassword,
          handleChangePassword,

          // Subscription
          subscription,
          isUpgrading,
          showUpgradeOptions,
          setShowUpgradeOptions,
          handleUpgrade,
          getPlanName,

          // Quote
          showQuoteModal,
          setShowQuoteModal,
          quoteForm,
          setQuoteForm,
          isSendingQuote,
          handleSendQuote,

          // OpenTable
          openTableConnected,
          isConnectingOpenTable,
          openTableRestaurantName,
          handleConnectOpenTable,
          handleDisconnectOpenTable,

          // Language
          language,
     };
}
