'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SecurityTabProps {
     passwords: { current: string; new: string; confirm: string };
     setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
     showPasswords: { current: boolean; new: boolean; confirm: boolean };
     setShowPasswords: React.Dispatch<React.SetStateAction<{ current: boolean; new: boolean; confirm: boolean }>>;
     isChangingPassword: boolean;
     handleChangePassword: () => void;
     language: string;
}

export function SecurityTab({
     passwords,
     setPasswords,
     showPasswords,
     setShowPasswords,
     isChangingPassword,
     handleChangePassword,
     language,
}: SecurityTabProps) {
     return (
          <div className="space-y-8">
               <div className="neumorphic rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 rounded-full bg-green-500/10">
                              <Lock className="h-5 w-5 text-green-500" />
                         </div>
                         <div>
                              <h3 className="text-lg font-semibold">{language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}</h3>
                              <p className="text-sm text-muted-foreground">
                                   {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password'}
                              </p>
                         </div>
                    </div>

                    <div className="grid gap-4 max-w-md">
                         <div className="space-y-2">
                              <Label>{language === 'es' ? 'Nueva contraseña' : 'New password'}</Label>
                              <div className="relative">
                                   <Input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        placeholder="••••••••"
                                   />
                                   <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                   >
                                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                   </button>
                              </div>
                         </div>

                         <div className="space-y-2">
                              <Label>{language === 'es' ? 'Confirmar nueva contraseña' : 'Confirm new password'}</Label>
                              <div className="relative">
                                   <Input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        placeholder="••••••••"
                                   />
                                   <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                   >
                                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                   </button>
                              </div>
                         </div>

                         <Button
                              onClick={handleChangePassword}
                              disabled={isChangingPassword || !passwords.new || !passwords.confirm}
                              className="mt-4"
                         >
                              {isChangingPassword ? (
                                   <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        {language === 'es' ? 'Actualizando...' : 'Updating...'}
                                   </span>
                              ) : (
                                   <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        {language === 'es' ? 'Actualizar contraseña' : 'Update Password'}
                                   </>
                              )}
                         </Button>
                    </div>
               </div>
          </div>
     );
}
