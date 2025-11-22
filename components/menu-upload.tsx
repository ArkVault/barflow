"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface MenuUploadProps {
     onSuppliesParsed: (supplies: any[]) => void;
}

export function MenuUpload({ onSuppliesParsed }: MenuUploadProps) {
     const { t } = useLanguage();
     const [file, setFile] = useState<File | null>(null);
     const [uploading, setUploading] = useState(false);
     const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
     const [message, setMessage] = useState('');

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) {
               // Validate file type
               const validTypes = ['csv', 'xlsx', 'xls'];
               const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();

               if (fileExt && validTypes.includes(fileExt)) {
                    setFile(selectedFile);
                    setStatus('idle');
                    setMessage('');
               } else {
                    setStatus('error');
                    setMessage('Tipo de archivo no válido. Use CSV o Excel.');
                    setFile(null);
               }
          }
     };

     const handleUpload = async () => {
          if (!file) return;

          setUploading(true);
          setStatus('idle');
          setMessage('');

          try {
               const formData = new FormData();
               formData.append('file', file);

               const response = await fetch('/api/parse-menu', {
                    method: 'POST',
                    body: formData,
               });

               const data = await response.json();

               if (!response.ok) {
                    throw new Error(data.error || 'Error al procesar el archivo');
               }

               setStatus('success');
               setMessage(`✓ ${data.supplies.length} insumos importados exitosamente`);
               onSuppliesParsed(data.supplies);

               // Clear file after success
               setTimeout(() => {
                    setFile(null);
                    setStatus('idle');
                    setMessage('');
               }, 3000);

          } catch (error) {
               console.error('Upload error:', error);
               setStatus('error');
               setMessage(error instanceof Error ? error.message : 'Error al procesar el archivo');
          } finally {
               setUploading(false);
          }
     };

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                         <FileSpreadsheet className="h-5 w-5 text-primary" />
                         Importar Menú
                    </CardTitle>
                    <CardDescription>
                         Sube tu menú en formato CSV o Excel y  nuestro AI lo parseará automáticamente
                    </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                         <label
                              htmlFor="menu-file"
                              className="flex-1 cursor-pointer"
                         >
                              <div className={`neumorphic-inset rounded-xl p-4 transition-all hover:bg-accent/50 ${file ? 'bg-primary/5' : ''
                                   }`}>
                                   <div className="flex items-center gap-3">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                             {file ? (
                                                  <div>
                                                       <p className="font-medium truncate">{file.name}</p>
                                                       <p className="text-xs text-muted-foreground">
                                                            {(file.size / 1024).toFixed(1)} KB
                                                       </p>
                                                  </div>
                                             ) : (
                                                  <p className="text-sm text-muted-foreground">
                                                       Haz clic para seleccionar archivo CSV o Excel
                                                  </p>
                                             )}
                                        </div>
                                   </div>
                              </div>
                              <input
                                   id="menu-file"
                                   type="file"
                                   accept=".csv,.xlsx,.xls"
                                   onChange={handleFileChange}
                                   className="hidden"
                                   disabled={uploading}
                              />
                         </label>

                         {file && (
                              <Button
                                   onClick={handleUpload}
                                   disabled={uploading || !file}
                                   className="neumorphic-hover h-full px-6"
                              >
                                   {uploading ? (
                                        <>
                                             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                             Procesando...
                                        </>
                                   ) : (
                                        <>
                                             <Upload className="h-4 w-4 mr-2" />
                                             Importar
                                        </>
                                   )}
                              </Button>
                         )}
                    </div>

                    {message && (
                         <div className={`flex items-center gap-2 p-3 rounded-lg ${status === 'success'
                                   ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                   : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                              {status === 'success' ? (
                                   <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                   <XCircle className="h-4 w-4" />
                              )}
                              <p className="text-sm font-medium">{message}</p>
                         </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                         <p>• Formatos aceptados: CSV (.csv), Excel (.xlsx, .xls)</p>
                         <p>• Los campos reconocidos: nombre, cantidad, unidad, categoría</p>
                         <p>• Otros campos serán ignorados automáticamente</p>
                    </div>
               </CardContent>
          </Card>
     );
}
