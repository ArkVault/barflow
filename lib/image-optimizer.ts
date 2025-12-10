/**
 * Optimizes an image file for web use
 * Compresses and resizes images to reduce file size while maintaining quality
 */

export interface ImageOptimizationOptions {
     maxSizeMB?: number;
     maxWidthOrHeight?: number;
     useWebWorker?: boolean;
     fileType?: string;
}

export async function optimizeImage(
     file: File,
     options: ImageOptimizationOptions = {}
): Promise<File> {
     const {
          maxSizeMB = 0.5, // 500KB max
          maxWidthOrHeight = 400, // Perfect for circular thumbnails
          useWebWorker = true,
          fileType = 'image/webp', // WebP for best compression
     } = options;

     return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = async (e) => {
               try {
                    const img = new Image();
                    img.src = e.target?.result as string;

                    await new Promise((resolve) => {
                         img.onload = resolve;
                    });

                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                         reject(new Error('Could not get canvas context'));
                         return;
                    }

                    // Calculate new dimensions maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                         if (width > maxWidthOrHeight) {
                              height = (height * maxWidthOrHeight) / width;
                              width = maxWidthOrHeight;
                         }
                    } else {
                         if (height > maxWidthOrHeight) {
                              width = (width * maxWidthOrHeight) / height;
                              height = maxWidthOrHeight;
                         }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw image with high quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob with compression
                    canvas.toBlob(
                         (blob) => {
                              if (!blob) {
                                   reject(new Error('Could not create blob'));
                                   return;
                              }

                              // Check if size is acceptable
                              const sizeMB = blob.size / 1024 / 1024;

                              if (sizeMB > maxSizeMB) {
                                   // Try with lower quality
                                   canvas.toBlob(
                                        (compressedBlob) => {
                                             if (!compressedBlob) {
                                                  reject(new Error('Could not create compressed blob'));
                                                  return;
                                             }

                                             const optimizedFile = new File(
                                                  [compressedBlob],
                                                  file.name.replace(/\.[^.]+$/, '.webp'),
                                                  { type: fileType }
                                             );

                                             resolve(optimizedFile);
                                        },
                                        fileType,
                                        0.7 // Lower quality for better compression
                                   );
                              } else {
                                   const optimizedFile = new File(
                                        [blob],
                                        file.name.replace(/\.[^.]+$/, '.webp'),
                                        { type: fileType }
                                   );

                                   resolve(optimizedFile);
                              }
                         },
                         fileType,
                         0.85 // High quality compression
                    );
               } catch (error) {
                    reject(error);
               }
          };

          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
     });
}

/**
 * Validates if a file is an image
 */
export function isValidImageFile(file: File): boolean {
     const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
     return validTypes.includes(file.type);
}

/**
 * Gets a preview URL for an image file
 */
export function getImagePreviewUrl(file: File): string {
     return URL.createObjectURL(file);
}

/**
 * Cleans up preview URL to prevent memory leaks
 */
export function revokeImagePreviewUrl(url: string): void {
     URL.revokeObjectURL(url);
}
