import type { ReactNode } from 'react';

export function WorkspacePage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  orgName: string;
  shows?: readonly unknown[];
  currentShow?: unknown;
  showPicker?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  // The focused show is picked in the workspace topbar now, so the old
  // in-page org/show bar is gone. orgName/shows/currentShow/showPicker are
  // still accepted (and ignored) so existing pages don't all change at once.

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions && <div className="fa-head-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyPanel({ title, note }: { title: string; note: string }) {
  return (
    <div className="fa-mini-card">
      <h4>{title}</h4>
      <p>{note}</p>
    </div>
  );
}
