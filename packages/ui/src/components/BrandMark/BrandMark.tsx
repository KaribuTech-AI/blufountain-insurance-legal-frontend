import { useId } from 'react';

/** The Blufountain drop, as in the prototype's header. Decorative. */
export function BrandMark({
  size = 30,
  className,
  tone = 'colour',
}: {
  size?: number;
  className?: string;
  /** `white` for the mark on a coloured tile (the rail's home button). */
  tone?: 'colour' | 'white';
}) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      {tone === 'colour' && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3BB4F2" />
            <stop offset="1" stopColor="#0B5CAD" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M16 2.5c5.6 7.4 10 12.6 10 17.6A10 10 0 0 1 6 20.1C6 15.1 10.4 9.9 16 2.5z"
        fill={tone === 'colour' ? `url(#${id})` : '#fff'}
      />
      {tone === 'colour' && (
        <path
          d="M11 21.2c1.6 2.6 4.3 3.6 7.2 3"
          stroke="#fff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity=".85"
        />
      )}
    </svg>
  );
}
