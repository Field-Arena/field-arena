import type { CSSProperties, ReactNode } from 'react';

export const LEGACY_COLOR = {
  hunterDeep: '#1F3A2E',
  hunterMid: '#345043',
  hunterPale: '#E7EEE9',
  gold: '#C9A227',
  goldPale: '#F6EDD2',
  cream: '#F7F3E9',
  white: '#FFFFFF',
  ink: '#22271F',
  inkSoft: '#6B7169',
  border: '#DED9C9',
  green: '#2E7D46',
  greenPale: '#E4F1E8',
  red: '#C0392B',
  redPale: '#FBEAE8',
  amber: '#9A6A12',
  amberBg: '#FCEBD2',
} as const;

export const LEGACY_RADIUS = '10px';
export const LEGACY_GEORGIA = "Georgia, 'Times New Roman', serif";
export const LEGACY_SYSTEM_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const legacyCardStyle: CSSProperties = {
  background: LEGACY_COLOR.cream,
  border: `1px solid ${LEGACY_COLOR.border}`,
  borderRadius: LEGACY_RADIUS,
  padding: '24px 28px',
  marginBottom: 16,
};

export function LegacySecTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: LEGACY_COLOR.hunterDeep,
        textTransform: 'uppercase',
        letterSpacing: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '0 0 4px',
        ...style,
      }}
    >
      <span
        style={{ width: 16, height: 2, background: LEGACY_COLOR.gold, display: 'inline-block' }}
      />
      {children}
    </div>
  );
}

export const legacySecNoteStyle: CSSProperties = {
  fontSize: 12.5,
  color: LEGACY_COLOR.inkSoft,
  margin: '0 0 12px',
};

export function legacyPillStyle(tone: 'ok' | 'warn' | 'bad'): CSSProperties {
  const byTone = {
    ok: { background: LEGACY_COLOR.greenPale, color: LEGACY_COLOR.green },
    warn: { background: LEGACY_COLOR.goldPale, color: LEGACY_COLOR.amber },
    bad: { background: LEGACY_COLOR.redPale, color: LEGACY_COLOR.red },
  } as const;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    ...byTone[tone],
  };
}

export const legacyRideRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  background: LEGACY_COLOR.white,
  border: `1px solid ${LEGACY_COLOR.border}`,
  borderRadius: 10,
  padding: '13px 16px',
  marginBottom: 8,
  flexWrap: 'wrap',
};
export const legacyRideNumStyle: CSSProperties = {
  fontFamily: LEGACY_GEORGIA,
  fontWeight: 700,
  color: LEGACY_COLOR.hunterDeep,
  fontSize: 18,
  flex: 'none',
  width: 34,
};
export const legacyRideTitleStyle: CSSProperties = { fontWeight: 700, color: LEGACY_COLOR.ink };
export const legacyRideMetaStyle: CSSProperties = {
  fontSize: 12.5,
  color: LEGACY_COLOR.inkSoft,
  marginTop: 2,
};
export const legacyRideScoreStyle: CSSProperties = {
  cursor: 'pointer',
  fontWeight: 700,
  color: LEGACY_COLOR.hunterDeep,
  textDecoration: 'underline',
  fontFamily: LEGACY_GEORGIA,
  fontSize: 16,
};

export const legacyButtonBase: CSSProperties = {
  fontFamily: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: 8,
  border: '1px solid transparent',
  fontSize: 14,
  padding: '12px 22px',
};
export const legacyButtonPrimaryStyle: CSSProperties = {
  ...legacyButtonBase,
  background: LEGACY_COLOR.hunterDeep,
  color: '#fff',
};
export const legacyButtonGhostStyle: CSSProperties = {
  ...legacyButtonBase,
  background: LEGACY_COLOR.white,
  color: LEGACY_COLOR.hunterDeep,
  borderColor: LEGACY_COLOR.border,
};

export const legacyTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13.5,
};
export const legacyTableHeadCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 6px',
  borderBottom: `1px solid ${LEGACY_COLOR.border}`,
  color: LEGACY_COLOR.inkSoft,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  fontWeight: 700,
};
export const legacyTableCellStyle: CSSProperties = {
  padding: '10px 6px',
  borderBottom: `1px solid ${LEGACY_COLOR.border}`,
  color: LEGACY_COLOR.ink,
};

export const legacyBlockTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: LEGACY_COLOR.hunterDeep,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  margin: '16px 0 8px',
};
