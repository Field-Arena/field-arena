import * as React from 'react';

/** Ported from the Admin Console design export's icons.tsx — the icon set its own components (StatCard, StatusPill, …) are drawn with. */
interface P {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const base = (size: number, strokeWidth: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const IconCheckCircle = ({ size = 17, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconXCircle = ({ size = 17, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconShieldAlert = ({ size = 17, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 3l8 4v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7z" />
    <path d="M12 8v4" />
    <path d="M12 15h.01" />
  </svg>
);

export const IconCalendarX = ({ size = 17, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M4 5h16v16H4z" />
    <path d="M4 10h16" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M10 14l4 4" />
    <path d="M14 14l-4 4" />
  </svg>
);

export const IconHorse = ({ size = 16, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M5 21c0-5 3-8 7-9l3-4 4-2-1 4 2 2-3 2c0 4-2 7-5 7z" />
    <path d="M9 21H5" />
  </svg>
);

export const IconChevronDown = ({ size = 14, strokeWidth = 2.6, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconChevronRight = ({ size = 11, strokeWidth = 3, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const IconCheck = ({ size = 13, strokeWidth = 3, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconX = ({ size = 13, strokeWidth = 3, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconAlert = ({ size = 13, strokeWidth = 2.6, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconPlus = ({ size = 15, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconBarn = ({ size = 15, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M3 21V10l9-6 9 6v11" />
    <path d="M9 21v-7h6v7" />
  </svg>
);

export const IconUpload = ({ size = 15, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export const IconFile = ({ size = 15, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
    <path d="M14 2v5h5" />
  </svg>
);

export const IconPrinter = ({ size = 15, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4v-6h16v6h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
