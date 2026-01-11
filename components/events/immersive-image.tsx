"use client";

import { useState, useCallback } from "react";

interface ImmersiveImageProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
}

/**
 * Renders an image with a blurred background fill to eliminate letterboxing.
 * For extreme landscape images (>2:1 ratio), crops to fill instead.
 */
export function ImmersiveImage({ src, alt, children }: ImmersiveImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  // Extreme landscape (>2:1) gets cropped, everything else shows full image
  const useObjectCover = aspectRatio !== null && aspectRatio > 2.0;

  return (
    <>
      {/* Blurred background layer - fills the container */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
      />

      {/* Main image - smart object-fit based on aspect ratio */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        className={`absolute inset-0 w-full h-full z-10 ${
          useObjectCover ? "object-cover" : "object-contain"
        }`}
      />

      {/* Overlay children (e.g., expand icon) */}
      {children}
    </>
  );
}
