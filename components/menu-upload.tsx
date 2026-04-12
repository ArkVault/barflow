"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
     Upload, FileSpreadsheet, CheckCircle2, XCircle,
     Package, Sparkles, BarChart3, X
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface MenuUploadProps {
     onSuppliesParsed: (supplies: any[]) => void;
}

// ─── Processing steps for the animated spinner ───
const PROCESSING_STEPS_ES = [
     { icon: Package, text: "Leyendo tu archivo...", delay: 0 },
     { icon: BarChart3, text: "Detectando productos y cantidades...", delay: 8000 },
     { icon: Sparkles, text: "Organizando categorías y unidades...", delay: 20000 },
     { icon: CheckCircle2, text: "Eliminando duplicados...", delay: 40000 },
     { icon: Sparkles, text: "Validando datos de inventario...", delay: 60000 },
     { icon: Package, text: "Casi listo, verificando precisión...", delay: 80000 },
];

const PROCESSING_STEPS_EN = [
     { icon: Package, text: "Reading your file...", delay: 0 },
     { icon: BarChart3, text: "Detecting products and quantities...", delay: 8000 },
     { icon: Sparkles, text: "Organizing categories and units...", delay: 20000 },
     { icon: CheckCircle2, text: "Removing duplicates...", delay: 40000 },
     { icon: Sparkles, text: "Validating inventory data...", delay: 60000 },
     { icon: Package, text: "Almost ready, verifying accuracy...", delay: 80000 },
];

export function MenuUpload({ onSuppliesParsed }: MenuUploadProps) {
     const { t, language } = useLanguage();
     const [file, setFile] = useState<File | null>(null);
     const [uploading, setUploading] = useState(false);
     const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
     const [message, setMessage] = useState('');
     const [currentStep, setCurrentStep] = useState(0);
     const [elapsedSeconds, setElapsedSeconds] = useState(0);
     const startTimeRef = useRef<number>(0);
     const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

     const steps = language === 'es' ? PROCESSING_STEPS_ES : PROCESSING_STEPS_EN;

     // Elapsed timer during processing
     useEffect(() => {
          if (uploading) {
               startTimeRef.current = Date.now();
               setElapsedSeconds(0);
               setCurrentStep(0);

               timerRef.current = setInterval(() => {
                    const elapsed = Date.now() - startTimeRef.current;
                    setElapsedSeconds(Math.floor(elapsed / 1000));

                    // Advance step based on elapsed time
                    const nextStep = [...steps]
                         .reverse()
                         .find(s => elapsed >= s.delay);
                    if (nextStep) {
                         setCurrentStep(steps.indexOf(nextStep));
                    }
               }, 1000);
          } else {
               if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
               }
          }

          return () => {
               if (timerRef.current) {
                    clearInterval(timerRef.current);
               }
          };
     }, [uploading, steps]);

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) {
               const validTypes = ['csv', 'xlsx', 'xls'];
               const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();

               if (fileExt && validTypes.includes(fileExt)) {
                    setFile(selectedFile);
                    setStatus('idle');
                    setMessage('');
               } else {
                    setStatus('error');
                    setMessage(language === 'es'
                         ? 'Tipo de archivo no válido. Use CSV o Excel.'
                         : 'Invalid file type. Use CSV or Excel.');
                    setFile(null);
               }
          }
     };

     const handleUpload = useCallback(async () => {
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
                    throw new Error(data.error || (language === 'es' ? 'Error al procesar el archivo' : 'Error processing file'));
               }

               setStatus('success');
               const summary = data.summary || { total: data.supplies?.length || 0, new: 0, matched: 0 };

               let successMessage = language === 'es'
                    ? `${summary.total} insumos importados - ${summary.new} nuevos - ${summary.matched} coincidencias`
                    : `${summary.total} supplies imported - ${summary.new} new - ${summary.matched} DB matches`;

               if (summary.detectedSheet) {
                    successMessage += language === 'es'
                         ? ` - Hoja: "${summary.detectedSheet}"`
                         : ` - Sheet: "${summary.detectedSheet}"`;
               }

               setMessage(successMessage);
               onSuppliesParsed(data.supplies);

               // Clear file after success
               setTimeout(() => {
                    setFile(null);
                    setStatus('idle');
                    setMessage('');
               }, 8000);

          } catch (error) {
               console.error('Upload error:', error);
               setStatus('error');
               setMessage(error instanceof Error ? error.message : (language === 'es' ? 'Error al procesar el archivo' : 'Error processing file'));
          } finally {
               setUploading(false);
          }
     }, [file, language, onSuppliesParsed]);

     const StepIcon = steps[currentStep]?.icon || Package;

     return (
          <>
               {/* ─── Processing Overlay / Popup ─── */}
               {uploading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                         <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border/50 bg-background p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                              {/* Animated spinner ring */}
                              <div className="flex flex-col items-center gap-6">
                                   <div className="relative">
                                        {/* Outer spinning ring */}
                                        <div className="h-20 w-20 rounded-full border-4 border-muted animate-spin"
                                             style={{ borderTopColor: 'hsl(var(--primary))', animationDuration: '1.5s' }} />
                                        {/* Inner icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                             <StepIcon className="h-8 w-8 text-primary animate-pulse" />
                                        </div>
                                   </div>

                                   {/* Title */}
                                   <div className="text-center space-y-2">
                                        <h3 className="text-lg font-semibold">
                                             {language === 'es'
                                                  ? 'Organizando tu stock'
                                                  : 'Organizing your stock'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground transition-all duration-500">
                                             {steps[currentStep]?.text}
                                        </p>
                                   </div>

                                   {/* Progress dots */}
                                   <div className="flex items-center gap-2">
                                        {steps.map((_, i) => (
                                             <div
                                                  key={i}
                                                  className={`h-2 rounded-full transition-all duration-500 ${
                                                       i <= currentStep
                                                            ? 'w-6 bg-primary'
                                                            : 'w-2 bg-muted'
                                                  }`}
                                             />
                                        ))}
                                   </div>

                                   {/* Elapsed time */}
                                   <p className="text-xs text-muted-foreground/60">
                                        {elapsedSeconds}s
                                   </p>

                                   {/* "Continue exploring" hint */}
                                   <div className="w-full rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                                        <p className="text-sm font-medium text-primary">
                                             {language === 'es'
                                                  ? 'Te notificamos cuando esté listo'
                                                  : "We'll notify you when it's ready"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                             {language === 'es'
                                                  ? 'Continúa explorando Flowstock mientras procesamos'
                                                  : 'Keep exploring Flowstock while we process'}
                                        </p>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}

               {/* ─── Upload Card ─── */}
               <Card className="neumorphic border-0">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                              <FileSpreadsheet className="h-5 w-5 text-primary" />
                              {language === 'es' ? 'Importar Menú' : 'Import Menu'}
                         </CardTitle>
                         <CardDescription>
                              {t('importDescription')}
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
                                                            {language === 'es'
                                                                 ? 'Haz clic para seleccionar archivo CSV o Excel'
                                                                 : 'Click to select a CSV or Excel file'}
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
                                        <Upload className="h-4 w-4 mr-2" />
                                        {language === 'es' ? 'Importar' : 'Import'}
                                   </Button>
                              )}
                         </div>

                         {/* Success / Error message */}
                         {message && !uploading && (
                              <div className={`flex items-start gap-2 p-3 rounded-lg animate-in slide-in-from-top-2 duration-300 ${status === 'success'
                                   ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                   : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                   }`}>
                                   {status === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                                   ) : (
                                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                   )}
                                   <p className="text-sm font-medium">{message}</p>
                              </div>
                         )}

                         <div className="text-xs text-muted-foreground space-y-1">
                              <p>• {language === 'es' ? 'Formatos aceptados:' : 'Accepted formats:'} CSV (.csv), Excel (.xlsx, .xls)</p>
                              <p>• {language === 'es' ? 'Los campos reconocidos:' : 'Recognized fields:'} {language === 'es' ? 'nombre, cantidad, unidad, categoría' : 'name, quantity, unit, category'}</p>
                              <p>• {language === 'es'
                                   ? 'Duplicados se fusionan automáticamente con IA'
                                   : 'Duplicates are automatically merged with AI'}</p>
                         </div>
                    </CardContent>
               </Card>
          </>
     );
}
