import { BRANDS, brandColor } from "../config";
import { inMonth, periodLabel } from "../lib/plan";

export default function Summary({ spots, M }) {
  const rows = BRANDS.flatMap(b =>
    spots
      .filter(s => s.brand === b && inMonth(s, M))
      .sort((x, y) => x.start.localeCompare(y.start))
  );
  const missing = BRANDS.filter(b => !spots.some(s => s.brand === b && inMonth(s, M)));

  return (
    <div className="card">
      <h2>Resumen</h2>
      <div className="sum">
        {rows.length === 0 && <div className="hint">No hay cuñas este mes.</div>}
        {rows.map(s => (
          <div key={s.id}>
            <b style={{ color: brandColor(s.brand) }}>{s.brand}</b> – {s.name} ({periodLabel(s, M)})
            {s.note && <span className="muted"> · {s.note}</span>}
          </div>
        ))}
        {missing.map(b => (
          <div key={b} className="warn"><b>{b}</b> – sin cuña asignada este mes</div>
        ))}
      </div>
    </div>
  );
}
