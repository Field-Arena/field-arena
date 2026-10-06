import Link from 'next/link';
import type { AttentionItem } from '@/modules/shows/types';

type Tone = 'red' | 'amber' | 'sky';

const WarnIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z"
    />
  </svg>
);
const ClockIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"
    />
  </svg>
);
const InfoIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3zM3 11h18M7 15h4" />
  </svg>
);
const Arrow = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Card({
  tone,
  title,
  detail,
  action,
  href,
}: {
  tone: Tone;
  title: string;
  detail: string;
  action: string;
  href: string;
}) {
  return (
    <Link href={href} prefetch={false} className={`fa-attn-card fa-${tone} no-underline`}>
      <div
        className="fa-ai"
        style={{ background: `var(--fa-${tone}-tint)`, color: `var(--fa-${tone})` }}
      >
        {tone === 'red' ? <WarnIcon /> : tone === 'amber' ? <ClockIcon /> : <InfoIcon />}
      </div>
      <div className="fa-ab">
        <h5>{title}</h5>
        <p>{detail}</p>
        <span className="fa-more" style={{ color: `var(--fa-${tone})` }}>
          {action} <Arrow />
        </span>
      </div>
    </Link>
  );
}

/** The dashboard's "needs attention" row — one card per item. Warnings read
 * red (they block the show), notes sky; the count of other shows still in
 * setup is its own amber card. */
export function AttentionCards({
  items,
  incompleteCount,
}: {
  items: AttentionItem[];
  incompleteCount: number;
}) {
  if (items.length === 0 && incompleteCount === 0) return null;

  return (
    <div className="fa-attn-row">
      {items.map((item) => (
        <Card
          key={item.label}
          tone={item.severity === 'warn' ? 'red' : 'sky'}
          title={item.label}
          detail={item.detail}
          action={item.actionLabel}
          href={item.href}
        />
      ))}
      {incompleteCount > 0 && (
        <Card
          tone="amber"
          title="Setup incomplete"
          detail={`${String(incompleteCount)} show${incompleteCount === 1 ? '' : 's'} still ${incompleteCount === 1 ? 'needs' : 'need'} setup before ${incompleteCount === 1 ? 'it' : 'they'} can open entries.`}
          action="Finish setup"
          href="/dashboard/shows/incomplete"
        />
      )}
    </div>
  );
}
