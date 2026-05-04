"use client";

/** Renders the first listing photo, or nothing (parent should show a fallback). */
export function PropertyCoverImage({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const src = images[0];
  if (!src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
}
