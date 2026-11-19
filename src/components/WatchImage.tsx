import React, { useEffect, useState } from 'react';
import { Watch } from 'lucide-react';

interface WatchImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const WatchImage: React.FC<WatchImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] to-[#121212] text-[#B3B3B3] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Watch className="w-8 h-8 mb-2 stroke-[1.25] text-[#C9A227]" />
        <span className="text-xs font-medium tracking-wide text-[#FFFFFF] line-clamp-2 max-w-[18ch]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
