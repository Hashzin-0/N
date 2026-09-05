'use client';

import { useId } from 'react';

interface GooeySvgFilterProps {
  id?: string;
  strength?: number;
}

export default function GooeySvgFilter({ id: customId, strength = 15 }: GooeySvgFilterProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = customId ?? `gooey-svg-${uid}`;

  return (
    <svg className="absolute" style={{ width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={strength}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="18 0 0 0 0
                    0 18 0 0 0
                    0 0 18 0 0
                    0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
