import { forwardRef } from 'react';
import Image from 'next/image';
import { assetUrl } from '@/utils/assetUrl';

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

const OptimizedImage = forwardRef(function OptimizedImage({
  src,
  alt = '',
  width = 800,
  height = 800,
  fill = false,
  sizes,
  unoptimized = true,
  ...props
}, ref) {
  const normalizedSrc = assetUrl(src);
  if (!normalizedSrc) return null;

  if (fill) {
    return (
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        sizes={sizes || '100vw'}
        unoptimized={unoptimized}
        ref={ref}
        {...props}
      />
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      width={toPositiveNumber(width, 800)}
      height={toPositiveNumber(height, 800)}
      sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
      unoptimized={unoptimized}
      ref={ref}
      {...props}
    />
  );
});

export default OptimizedImage;
