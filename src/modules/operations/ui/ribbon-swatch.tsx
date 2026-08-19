import { RIBBONS } from '@/modules/operations/constants';

export function RibbonSwatch({ place }: { place: number }) {
  if (place > RIBBONS.length) return null;
  const rb = RIBBONS[place - 1];
  if (!rb) return null;
  return (
    <span
      title={`${rb.name} · ${String(place)}`}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: rb.bg,
        border: rb.bg === '#FFFFFF' ? '1px solid #CBB37A' : '1px solid transparent',
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}
