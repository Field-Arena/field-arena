/** Coloured level pill from the prototype (events.js lvlPill): tinted
 * background (12% of the level colour) with the colour as text. */
export function LevelPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="rounded-[5px] px-[7px] py-px text-[11px] font-semibold"
      style={{ background: `${color}1f`, color }}
    >
      {name}
    </span>
  );
}

/** Solid governing-body pill (FEI / USEF/USDF / USDF / USEF …). */
export function BodyPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-[5px] px-[7px] py-0.5 text-[10px] font-extrabold tracking-[.04em] whitespace-nowrap text-white"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
