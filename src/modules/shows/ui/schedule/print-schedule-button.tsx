'use client';

export function PrintScheduleButton() {
  return (
    <button
      type="button"
      className="fa-btn fa-btn-ghost"
      onClick={() => {
        window.print();
      }}
    >
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M7 14h10v7H7z"
        />
      </svg>
      Print schedule
    </button>
  );
}
