import { useEffect, useMemo, useState } from "react";
import { BRANDS } from "../config";
import { inMonth, monthInfo, monthTitle, nextMonthKey, shiftMonthKey, spotError } from "../lib/plan";
import { useSpots } from "../lib/useSpots";
import Gantt from "./Gantt";
import SpotsTable from "./SpotsTable";
import Summary from "./Summary";

const MONTH_KEY = "planRadio.month";

function initialMonth() {
  try { return localStorage.getItem(MONTH_KEY) || nextMonthKey(); } catch { return nextMonthKey(); }
}

export default function PlanPage({ user, onSignOut }) {
  const { spots, loading, error, saving, clearError, reload, flush, updateSpot, addSpot, deleteSpot } = useSpots();
  const [ym, setYm] = useState(initialMonth);
  const M = useMemo(() => monthInfo(ym), [ym]);

  // Filas de la tabla: se fijan al cambiar de mes o al cargar, para que una cuña no
  // desaparezca de la tabla mientras se le cambian las fechas. Las inválidas siempre se ven.
  const [rowIds, setRowIds] = useState(new Set());
  useEffect(() => {
    setRowIds(new Set(spots.filter(s => inMonth(s, M) || spotError(s)).map(s => s.id)));
  }, [ym, loading]); // a propósito no depende de `spots`

  const rows = spots
    .filter(s => rowIds.has(s.id) || spotError(s))
    .sort((a, b) => BRANDS.indexOf(a.brand) - BRANDS.indexOf(b.brand) || a.start.localeCompare(b.start));

  useEffect(() => {
    document.title = `Plan de medios Radio ${monthTitle(M)}`; // nombre sugerido del PDF
    try { localStorage.setItem(MONTH_KEY, ym); } catch { /* sin almacenamiento local */ }
  }, [M, ym]);

  const handleAdd = async () => {
    const added = await addSpot({ brand: BRANDS[0], name: "Nueva campaña", start: M.first, end: M.last, note: "" });
    if (added) setRowIds(ids => new Set(ids).add(added.id));
  };

  const handleDelete = s => {
    if (window.confirm(`¿Eliminar la cuña «${s.name}» de ${s.brand}?`)) deleteSpot(s.id);
  };

  const handleSignOut = async () => {
    await flush();
    onSignOut();
  };

  return (
    <>
      <div className="top">
        <h1>Plan de medios · Radio — {monthTitle(M)}</h1>
        <div className="nav">
          <button onClick={() => setYm(shiftMonthKey(ym, -1))} title="Mes anterior" aria-label="Mes anterior">‹</button>
          <input type="month" value={ym} onChange={e => e.target.value && setYm(e.target.value)} aria-label="Mes" />
          <button onClick={() => setYm(shiftMonthKey(ym, 1))} title="Mes siguiente" aria-label="Mes siguiente">›</button>
          <button className="pri" onClick={() => window.print()}>🖨 Imprimir / guardar PDF</button>
          <span className="user muted" title={user.email}>{saving ? "Guardando…" : user.email}</span>
          <button onClick={handleSignOut}>Salir</button>
        </div>
      </div>

      {error && (
        <div className="alert no-print">
          {error} <button onClick={() => { clearError(); reload(); }}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="card hint">Cargando plan…</div>
      ) : (
        <>
          <Gantt spots={spots} M={M} />
          <SpotsTable
            rows={rows}
            onUpdate={updateSpot}
            onFullMonth={id => updateSpot(id, { start: M.first, end: M.last })}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
          <Summary spots={spots} M={M} />
        </>
      )}
    </>
  );
}
