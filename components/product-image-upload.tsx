'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { optimizeImage, isValidImageFile, getImagePreviewUrl, revokeImagePreviewUrl } from '@/lib/image-optimizer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProductImageUploadProps {
     productId: string;
     currentImageUrl?: string | null;
     onImageUpdate: (imageUrl: string) => void;
     size?: number;
}

export function ProductImageUpload({
     productId,
     currentImageUrl,
     onImageUpdate,
     size = 140,
}: ProductImageUploadProps) {
     const [uploading, setUploading] = useState(false);
     const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
     const [isHovered, setIsHovered] = useState(false);
     const fileInputRef = useRef<HTMLInputElement>(null);

     const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) return;

          // Validate file type
          if (!isValidImageFile(file)) {
               toast.error('Por favor selecciona una imagen válida (JPG, PNG, WebP, GIF)');
               return;
          }

          // Check file size (max 10MB before optimization)
          if (file.size > 10 * 1024 * 1024) {
               toast.error('La imagen es demasiado grande. Máximo 10MB');
               return;
          }

          try {
               setUploading(true);

               // Optimize image
               toast.info('Optimizando imagen...');
               const optimizedFile = await optimizeImage(file, {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 400,
                    fileType: 'image/webp',
               });

               console.log(`Original: ${(file.size / 1024).toFixed(2)}KB → Optimized: ${(optimizedFile.size / 1024).toFixed(2)}KB`);

               // Upload to Supabase Storage
               const supabase = createClient();
               const fileExt = 'webp';
               const fileName = `${productId}-${Date.now()}.${fileExt}`;
               const filePath = `products/${fileName}`;

               // Create bucket if it doesn't exist (will fail silently if it does)
               await supabase.storage.createBucket('product-images', {
                    public: true,
                    fileSizeLimit: 1024 * 1024, // 1MB limit
               });

               // Upload file
               const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, optimizedFile, {
                         cacheControl: '3600',
                         upsert: true,
                    });

               if (uploadError) {
                    throw uploadError;
               }

               // Get public URL
               const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

               // Update product in database
               const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_url: publicUrl })
                    .eq('id', productId);

               if (updateError) {
                    throw updateError;
               }

               // Update preview
               if (previewUrl && previewUrl !== currentImageUrl) {
                    revokeImagePreviewUrl(previewUrl);
               }
               setPreviewUrl(publicUrl);
               onImageUpdate(publicUrl);

               toast.success('Imagen actualizada correctamente');
          } catch (error: any) {
               console.error('Error uploading image:', error);
               toast.error(error.message || 'Error al subir la imagen');
          } finally {
               setUploading(false);
               if (fileInputRef.current) {
                    fileInputRef.current.value = '';
               }
          }
     };

     const handleRemoveImage = async (e: React.MouseEvent) => {
          e.stopPropagation();

          try {
               setUploading(true);
               const supabase = createClient();

               // Update product in database
               const { error } = await supabase
                    .from('products')
                    .update({ image_url: null })
                    .eq('id', productId);

               if (error) throw error;

               if (previewUrl) {
                    revokeImagePreviewUrl(previewUrl);
               }
               setPreviewUrl(null);
               onImageUpdate('');

               toast.success('Imagen eliminada');
          } catch (error: any) {
               console.error('Error removing image:', error);
               toast.error('Error al eliminar la imagen');
          } finally {
               setUploading(false);
          }
     };

     const handleCircleClick = () => {
          if (!uploading) {
               fileInputRef.current?.click();
          }
     };

     return (
          <div className="flex flex-col items-center">
               {/* Hidden file input */}
               <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
               />

               {/* Clickable circular image area */}
               <div
                    onClick={handleCircleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border cursor-pointer transition-all hover:scale-105 hover:border-primary"
                    style={{ width: size, height: size }}
               >
                    {previewUrl ? (
                         <>
                              <img
                                   src={previewUrl}
                                   alt="Product"
                                   className="w-full h-full object-cover"
                              />

                              {/* Hover overlay with actions */}
                              {isHovered && !uploading && (
                                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-white">
                                             <Camera className="w-8 h-8" />
                                             <span className="text-xs font-medium">Cambiar</span>
                                        </div>
                                   </div>
                              )}

                              {/* Remove button */}
                              {!uploading && (
                                   <button
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors shadow-lg z-10"
                                        title="Eliminar imagen"
                                   >
                                        <X className="w-4 h-4" />
                                   </button>
                              )}
                         </>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-muted-foreground">
                              {isHovered && !uploading ? (
                                   <>
                                        <Camera className="w-10 h-10 mb-2" />
                                        <span className="text-sm font-medium">Subir imagen</span>
                                   </>
                              ) : (
                                   <>
                                        <Upload className="w-10 h-10 mb-2" />
                                        <span className="text-xs">Sin imagen</span>
                                   </>
                              )}
                         </div>
                    )}

                    {/* Loading overlay */}
                    {uploading && (
                         <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                         </div>
                    )}
               </div>
          </div>
     );
}
