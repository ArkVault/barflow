'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Save } from 'lucide-react';
import type { UserProfile } from './use-account-profile';

interface ProfileTabProps {
     profile: UserProfile;
     setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
     isEditing: boolean;
     setIsEditing: (editing: boolean) => void;
     isSaving: boolean;
     handleSaveProfile: () => void;
     language: string;
}

export function ProfileTab({
     profile,
     setProfile,
     isEditing,
     setIsEditing,
     isSaving,
     handleSaveProfile,
     language,
}: ProfileTabProps) {
     return (
          <div className="space-y-8">
               <div className="neumorphic rounded-2xl p-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                   {language === 'es' ? 'Nombre completo' : 'Full Name'}
                              </Label>
                              {isEditing ? (
                                   <Input
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="text-lg"
                                   />
                              ) : (
                                   <p className="text-lg font-light">{profile.full_name || '—'}</p>
                              )}
                         </div>

                         <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                   Email
                              </Label>
                              <p className="text-lg font-light">{profile.email}</p>
                         </div>

                         <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                   {language === 'es' ? 'Teléfono' : 'Phone'}
                              </Label>
                              {isEditing ? (
                                   <Input
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="text-lg"
                                   />
                              ) : (
                                   <p className="text-lg font-light">{profile.phone || '—'}</p>
                              )}
                         </div>

                         <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                   {language === 'es' ? 'Establecimiento' : 'Establishment'}
                              </Label>
                              {isEditing ? (
                                   <Input
                                        value={profile.establishment_name}
                                        onChange={(e) => setProfile({ ...profile, establishment_name: e.target.value })}
                                        className="text-lg"
                                   />
                              ) : (
                                   <p className="text-lg font-light">{profile.establishment_name || '—'}</p>
                              )}
                         </div>
                    </div>

                    <div className="flex items-center justify-end pt-6 mt-2 border-t border-border">
                         {!isEditing ? (
                              <Button variant="outline" onClick={() => setIsEditing(true)}>
                                   <Edit2 className="mr-2 h-4 w-4" />
                                   {language === 'es' ? 'Editar perfil' : 'Edit Profile'}
                              </Button>
                         ) : (
                              <div className="flex gap-3">
                                   <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                                   </Button>
                                   <Button onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? (
                                             <span className="flex items-center gap-2">
                                                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                                  {language === 'es' ? 'Guardando...' : 'Saving...'}
                                             </span>
                                        ) : (
                                             <>
                                                  <Save className="mr-2 h-4 w-4" />
                                                  {language === 'es' ? 'Guardar cambios' : 'Save Changes'}
                                             </>
                                        )}
                                   </Button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
