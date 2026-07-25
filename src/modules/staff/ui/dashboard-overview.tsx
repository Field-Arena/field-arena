import {
  SHOW_STAGES,
  CURRENT_STAGE,
  CURRENT_ORG,
  CURRENT_SHOW,
  DASHBOARD_STATS,
  RING_TIMERS,
  SHOW_INVENTORY,
} from '../constants';
import { DashIcon } from './dash-icon';

const CLOCK = '5:42:43 AM';

export function DashboardOverview() {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === CURRENT_STAGE);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Dashboard</h1>
          <p>Everything across your shows, in one place.</p>
        </div>
        <button type="button" className="dash-btn dash-btn-dark">
          <DashIcon name="mobile" size={15} /> Mobile preview
        </button>
      </div>

      {/* Progress stepper */}
      <div className="dash-card">
        <div className="stepper">
          {SHOW_STAGES.map((stage, i) => (
            <div key={stage.key} style={{ display: 'contents' }}>
              <div className={`stepper-step${i === currentIndex ? ' current' : ''}`}>
                <span className="stepper-dot" />
                {stage.label}
              </div>
              {i < SHOW_STAGES.length - 1 && <span className="stepper-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Show summary */}
      <div className="dash-card">
        <div className="showbar">
          <span className="showbar-org">{CURRENT_ORG}</span>
          <select className="dash-select" style={{ maxWidth: 380 }} aria-label="Select show">
            <option>
              {CURRENT_SHOW.name} ({CURRENT_SHOW.dateLabel})
            </option>
          </select>
          <div className="showbar-actions">
            <button type="button" className="dash-btn dash-btn-outline">
              <DashIcon name="plus" size={14} /> New Show
            </button>
            <button type="button" className="dash-btn dash-btn-outline">
              <DashIcon name="trophy" size={14} /> Results
            </button>
            <button type="button" className="dash-btn dash-btn-dark">
              Exit ShowManager
            </button>
          </div>
        </div>

        <div className="stat-grid">
          {DASHBOARD_STATS.map((stat) => (
            <div key={stat.label} className={`stat${'revenue' in stat ? ' revenue' : ''}`}>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="rings">
          <div className="rings-clock">{CLOCK}</div>
          {RING_TIMERS.map((r) => (
            <div key={r.ring} className="ring">
              {r.ring} {r.delay}
            </div>
          ))}
        </div>
      </div>

      {/* Show detail */}
      <div className="dash-card" style={{ borderLeft: '4px solid #1f7a44' }}>
        <h2 className="show-detail-title">{CURRENT_SHOW.name}</h2>
        <p className="show-detail-meta">
          {CURRENT_SHOW.dateLabel} · {CURRENT_SHOW.venue}
        </p>

        <div className="inv-head">
          <span>Purchases &amp; inventory</span>
          <span>Qty</span>
          <span>Revenue</span>
        </div>
        {SHOW_INVENTORY.map((row) => (
          <div key={row.name} className="inv-row">
            <span className="inv-name">{row.name}</span>
            <span className="inv-qty">{row.qty}</span>
            <span className="inv-rev">{row.revenue}</span>
          </div>
        ))}

        <div className="show-detail-foot">
          <span>This show is live. Jump into ShowManager to manage the day.</span>
          <button type="button" className="dash-btn dash-btn-green">
            Open ShowManager ▶
          </button>
        </div>
      </div>
    </>
  );
}
