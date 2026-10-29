import { BRANDS, brandColor } from "../config";
import { WEEKDAY_INITIALS, assignLanes, formatGaps, gaps, hasOverlap, inMonth, isWeekend, periodLabel, spanInMonth } from "../lib/plan";

const LANE_HEIGHT = 28;

function DayCells({ M, header }) {
  return (
    <div className="days" style={header ? undefined : { position: "absolute", inset: 0 }}>
      {Array.from({ length: M.days }, (_, i) => {
        const day = i + 1;
        const weekday = new Date(M.y, M.m - 1, day).getDay();
        return (
          <div key={day} className={`d${isWeekend(M, day) ? " w" : ""}`} style={header ? undefined : { padding: 0 }}>
            {header && <>{day}<br />{WEEKDAY_INITIALS[weekday]}</>}
          </div>
        );
      })}
    </div>
  );
}

function BrandRow({ brand, spots, M }) {
  const pc = 100 / M.days;
  const { laneOf, count } = assignLanes(spots);
  const gapList = gaps(spots, M);

  return (
    <div className="gr">
      <div className="gl">
        {brand}
        {gapList.length > 0 && <small>Sin cuña: {formatGaps(gapList)}</small>}
        {hasOverlap(spots) && <small>Cuñas solapadas</small>}
      </div>
      <div className="gb" style={{ height: count * LANE_HEIGHT + 6 }}>
        <DayCells M={M} />
        {gapList.map(([a, z]) => (
          <div key={a} className="gap" style={{ left: `${(a - 1) * pc}%`, width: `${(z - a + 1) * pc}%` }} />
        ))}
        {spots.map(s => {
          const [a, z] = spanInMonth(s, M);
          return (
            <div
              key={s.id}
              className="bar"
              title={`${s.name} · ${periodLabel(s, M)}`}
              style={{
                background: brandColor(brand),
                left: `calc(${(a - 1) * pc}% + 1px)`,
                width: `calc(${(z - a + 1) * pc}% - 2px)`,
                top: laneOf.get(s.id) * LANE_HEIGHT + 3
              }}
            >
              {s.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Gantt({ spots, M }) {
  return (
    <div className="card">
      <h2>Vista general del mes</h2>
      <div className="sc">
        <div className="g">
          <div className="gr hd">
            <div className="gl" />
            <div className="gb"><DayCells M={M} header /></div>
          </div>
          {BRANDS.map(b => (
            <BrandRow key={b} brand={b} M={M} spots={spots.filter(s => s.brand === b && inMonth(s, M))} />
          ))}
        </div>
      </div>
      <div className="lg">
        {BRANDS.map(b => (
          <span key={b}><i className="dot" style={{ background: brandColor(b) }} />{b}</span>
        ))}
        <span><i className="dot" style={{ background: "var(--gap)", border: "1px solid var(--gapt)" }} />Días sin cuña</span>
      </div>
    </div>
  );
}
