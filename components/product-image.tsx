'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
     src?: string | null;
     alt: string;
     size?: number;
     className?: string;
}

export function ProductImage({ src, alt, size = 80, className = '' }: ProductImageProps) {
     const [imageError, setImageError] = useState(false);
     const [imageLoading, setImageLoading] = useState(true);

     if (!src || imageError) {
          return (
               <div
                    className={`rounded-full bg-muted flex items-center justify-center ${className}`}
                    style={{ width: size, height: size }}
               >
                    <Package className="w-1/2 h-1/2 text-muted-foreground" />
               </div>
          );
     }

     return (
          <div
               className={`rounded-full overflow-hidden bg-muted ${className}`}
               style={{ width: size, height: size }}
          >
               {imageLoading && (
                    <div className="w-full h-full flex items-center justify-center">
                         <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
               )}
               <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover ${imageLoading ? 'hidden' : 'block'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                         setImageError(true);
                         setImageLoading(false);
                    }}
               />
          </div>
     );
}
