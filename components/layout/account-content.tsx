"use client";

import { useState } from "react";
import { useAccountProfile } from "./account/use-account-profile";
import { ProfileTab } from "./account/profile-tab";
import { SecurityTab } from "./account/security-tab";
import { SubscriptionTab } from "./account/subscription-tab";
import { ConnectionsTab } from "./account/connections-tab";
import { QuoteModal } from "./account/quote-modal";

type AccountTab = "profile" | "security" | "subscription" | "connections";

const TAB_COLORS: Record<AccountTab, string> = {
     profile: "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]",
     security: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]",
     subscription: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]",
     connections: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]",
};

export default function AccountContent() {
     const [activeTab, setActiveTab] = useState<AccountTab>("profile");
     const account = useAccountProfile();
     const { language } = account;

     const tabs: { key: AccountTab; label: string }[] = [
          { key: "profile", label: language === 'es' ? 'Datos de perfil' : 'Profile Data' },
          { key: "security", label: language === 'es' ? 'Seguridad' : 'Security' },
          { key: "subscription", label: language === 'es' ? 'Suscripción' : 'Subscription' },
          { key: "connections", label: language === 'es' ? 'Conexiones' : 'Connections' },
     ];

     return (
          <div className="max-w-5xl mx-auto p-6 space-y-8">
               {/* Header */}
               <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{language === 'es' ? 'Mi Cuenta' : 'My Account'}</h1>
                    <p className="text-muted-foreground">
                         {language === 'es' ? 'Administra tu perfil, seguridad y suscripción' : 'Manage your profile, security and subscription'}
                    </p>
               </div>

               {/* Tabs */}
               <div className="flex gap-6 border-b border-border">
                    {tabs.map(({ key, label }) => (
                         <button
                              key={key}
                              onClick={() => setActiveTab(key)}
                              className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                         >
                              {label}
                              {activeTab === key && (
                                   <span className={`absolute bottom-0 left-0 h-0.5 w-full ${TAB_COLORS[key]}`} />
                              )}
                         </button>
                    ))}
               </div>

               {/* Content */}
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "profile" && (
                         <ProfileTab
                              profile={account.profile}
                              setProfile={account.setProfile}
                              isEditing={account.isEditing}
                              setIsEditing={account.setIsEditing}
                              isSaving={account.isSaving}
                              handleSaveProfile={account.handleSaveProfile}
                              language={language}
                         />
                    )}

                    {activeTab === "security" && (
                         <SecurityTab
                              passwords={account.passwords}
                              setPasswords={account.setPasswords}
                              showPasswords={account.showPasswords}
                              setShowPasswords={account.setShowPasswords}
                              isChangingPassword={account.isChangingPassword}
                              handleChangePassword={account.handleChangePassword}
                              language={language}
                         />
                    )}

                    {activeTab === "subscription" && (
                         <SubscriptionTab
                              subscription={account.subscription}
                              isUpgrading={account.isUpgrading}
                              showUpgradeOptions={account.showUpgradeOptions}
                              setShowUpgradeOptions={account.setShowUpgradeOptions}
                              handleUpgrade={account.handleUpgrade}
                              getPlanName={account.getPlanName}
                              setShowQuoteModal={account.setShowQuoteModal}
                              language={language}
                         />
                    )}

                    {activeTab === "connections" && (
                         <ConnectionsTab
                              openTableConnected={account.openTableConnected}
                              openTableRestaurantName={account.openTableRestaurantName}
                              language={language}
                         />
                    )}
               </div>

               {/* Quote Request Modal */}
               <QuoteModal
                    show={account.showQuoteModal}
                    onClose={() => account.setShowQuoteModal(false)}
                    quoteForm={account.quoteForm}
                    setQuoteForm={account.setQuoteForm}
                    isSendingQuote={account.isSendingQuote}
                    handleSendQuote={account.handleSendQuote}
                    language={language}
               />
          </div>
     );
}
