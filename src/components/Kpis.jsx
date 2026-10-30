import { BRANDS } from "../config";
import { gaps, inMonth } from "../lib/plan";

function Kpi({ label, value, total, sub, tone }) {
  return (
    <div className={`card kpi${tone ? ` ${tone}` : ""}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}{total !== undefined && <small> / {total}</small>}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

/** Resumen del mes en tarjetas: cuñas, cobertura por marca y días sin cuña. */
export default function Kpis({ spots, M }) {
  const monthSpots = spots.filter(s => inMonth(s, M));
  const byBrand = BRANDS.map(brand => {
    const list = monthSpots.filter(s => s.brand === brand);
    return { brand, list, gapDays: list.length ? gaps(list, M).reduce((n, [a, z]) => n + z - a + 1, 0) : 0 };
  });

  const withSpots = byBrand.filter(b => b.list.length);
  const fullMonth = withSpots.filter(b => b.gapDays === 0);
  const missing = byBrand.filter(b => !b.list.length);
  const partial = withSpots.filter(b => b.gapDays > 0);
  const gapDays = partial.reduce((n, b) => n + b.gapDays, 0);

  return (
    <div className="kpis">
      <Kpi
        label="Cuñas este mes"
        value={monthSpots.length}
        sub={withSpots.length ? `en ${withSpots.length} ${withSpots.length === 1 ? "marca" : "marcas"}` : "Ninguna planificada"}
      />
      <Kpi
        label="Marcas con mes completo"
        value={fullMonth.length}
        total={BRANDS.length}
        tone={fullMonth.length === BRANDS.length ? "good" : undefined}
        sub={fullMonth.length ? fullMonth.map(b => b.brand).join(", ") : "Ninguna todavía"}
      />
      <Kpi
        label="Marcas sin cuña"
        value={missing.length}
        tone={missing.length ? "danger" : "good"}
        sub={missing.length ? missing.map(b => b.brand).join(", ") : "Todas tienen cuña"}
      />
      <Kpi
        label="Días sin cobertura"
        value={gapDays}
        tone={gapDays ? "danger" : undefined}
        sub={partial.length ? partial.map(b => `${b.brand} (${b.gapDays})`).join(", ") : "Sin huecos en marcas con cuña"}
      />
    </div>
  );
}
